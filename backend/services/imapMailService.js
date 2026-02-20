const { ImapFlow } = require('imapflow');

// Create a new IMAP client for each operation (ImapFlow doesn't support reuse)
async function createClient() {
  const {
    MAIL_IMAP_HOST,
    MAIL_IMAP_PORT,
    MAIL_IMAP_SECURE,
    MAIL_IMAP_USER,
    MAIL_IMAP_PASS
  } = process.env;

  if (!MAIL_IMAP_HOST || !MAIL_IMAP_PORT || !MAIL_IMAP_USER || !MAIL_IMAP_PASS) {
    throw new Error('IMAP environment variables are not fully configured. MAIL_IMAP_HOST, MAIL_IMAP_PORT, MAIL_IMAP_USER, MAIL_IMAP_PASS are required.');
  }

  const client = new ImapFlow({
    host: MAIL_IMAP_HOST,
    port: Number(MAIL_IMAP_PORT) || 993,
    secure: MAIL_IMAP_SECURE === 'true',
    auth: {
      user: MAIL_IMAP_USER,
      pass: MAIL_IMAP_PASS
    },
    logger: false // Disable verbose logging
  });

  await client.connect();
  return client;
}

async function listFolders() {
  const client = await createClient();
  try {
    const mailboxes = [];
    for await (const mailbox of client.list()) {
      mailboxes.push({
        name: mailbox.name,
        path: mailbox.path,
        flags: mailbox.flags
      });
    }
    return mailboxes;
  } finally {
    await client.logout();
  }
}

async function getInbox({ folder = 'INBOX', page = 1, limit = 20 }) {
  const client = await createClient();
  try {
    const mailbox = await client.mailboxOpen(folder, { readOnly: true });

    const total = mailbox.exists || 0;
    if (total === 0) {
      return { total: 0, page, pages: 0, messages: [] };
    }

    const safeLimit = Math.max(1, Math.min(limit, 100));
    const pages = Math.ceil(total / safeLimit);
    const currentPage = Math.min(Math.max(page, 1), pages);

    const endSeq = total - (currentPage - 1) * safeLimit;
    const startSeq = Math.max(1, endSeq - safeLimit + 1);

    const messages = [];
    for await (const msg of client.fetch(
      { seq: `${startSeq}:${endSeq}` },
      {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true,
        bodyStructure: true,
        source: false
      }
    )) {
      const { uid, envelope, flags, internalDate, bodyStructure } = msg;
      const hasAttachments =
        !!bodyStructure &&
        (Array.isArray(bodyStructure.childNodes)
          ? bodyStructure.childNodes.some(
              (p) => p.disposition && p.disposition.type && p.disposition.type.toLowerCase() === 'attachment'
            )
          : false);

      messages.push({
        id: uid,
        subject: envelope.subject,
        from: envelope.from && envelope.from.length ? `${envelope.from[0].name || ''} <${envelope.from[0].address}>` : '',
        date: internalDate,
        seen: flags && flags.includes('\\Seen'),
        hasAttachments
      });
    }

    // Messages are returned from low → high; sort descending by date/uid
    messages.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      total,
      page: currentPage,
      pages,
      messages
    };
  } finally {
    await client.logout();
  }
}

async function getMessage({ folder = 'INBOX', uid }) {
  const client = await createClient();
  try {
    await client.mailboxOpen(folder, { readOnly: true });

    const msg = await client.fetchOne(
      { uid },
      {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true,
        bodyStructure: true,
        bodyParts: ['text/plain', 'text/html']
      }
    );

    if (!msg) return null;

    const { envelope, flags, internalDate, bodyStructure } = msg;

    const attachments = [];
    if (bodyStructure && Array.isArray(bodyStructure.childNodes)) {
      bodyStructure.childNodes.forEach((part, index) => {
        if (
          part.disposition &&
          part.disposition.type &&
          part.disposition.type.toLowerCase() === 'attachment'
        ) {
          attachments.push({
            partId: part.part || String(index + 1),
            filename: (part.disposition.params && part.disposition.params.filename) || part.filename,
            mimeType: `${part.type}/${part.subtype}`
          });
        }
      });
    }

    // Fetch bodies
    let text = '';
    let html = '';
    for await (const part of client.fetch(
      { uid },
      { bodyParts: ['text/plain', 'text/html'] }
    )) {
      if (part.bodyParts) {
        if (part.bodyParts['text/plain']) {
          text = part.bodyParts['text/plain'].toString();
        }
        if (part.bodyParts['text/html']) {
          html = part.bodyParts['text/html'].toString();
        }
      }
    }

    return {
      id: uid,
      subject: envelope.subject,
      from: envelope.from && envelope.from.length ? `${envelope.from[0].name || ''} <${envelope.from[0].address}>` : '',
      to: envelope.to || [],
      date: internalDate,
      seen: flags && flags.includes('\\Seen'),
      text,
      html,
      attachments
    };
  } finally {
    await client.logout();
  }
}

async function streamAttachment({ folder = 'INBOX', uid, partId, res }) {
  const client = await createClient();
  try {
    await client.mailboxOpen(folder, { readOnly: true });

    for await (const msg of client.fetch({ uid }, { source: true, bodyParts: [partId] })) {
      if (!msg.bodyParts || !msg.bodyParts[partId]) continue;
      const stream = msg.bodyParts[partId];
      // Pass through stream directly to response
      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('end', resolve);
        stream.pipe(res);
      });
      return;
    }
    res.status(404).end();
  } finally {
    await client.logout();
  }
}

async function markRead({ folder = 'INBOX', uid, seen }) {
  const client = await createClient();
  try {
    await client.mailboxOpen(folder, { readOnly: false });
    if (seen) {
      await client.messageFlagsAdd({ uid }, ['\\Seen']);
    } else {
      await client.messageFlagsRemove({ uid }, ['\\Seen']);
    }
  } finally {
    await client.logout();
  }
}

async function deleteMessage({ folder = 'INBOX', uid }) {
  const client = await createClient();
  try {
    await client.mailboxOpen(folder, { readOnly: false });
    await client.messageDelete({ uid });
  } finally {
    await client.logout();
  }
}

module.exports = {
  listFolders,
  getInbox,
  getMessage,
  streamAttachment,
  markRead,
  deleteMessage
};

