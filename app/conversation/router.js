const express = require('express');
const { authorize, authenticateJWT } = require('../../middleware/index');
const {
    getOrCreateConversation,
    addMessageToConversation,
    getMessagesByConversation,
    addMessageToConversationByAdmin
} = require('./controller');

const router = express.Router();

// Endpoint untuk membuat atau mendapatkan percakapan (khusus customer)
router.post(
    '/chat',
    authenticateJWT,
    authorize('create', 'Conversation'), // Pastikan customer bisa membuat conversation
    getOrCreateConversation
);

// Endpoint untuk menambahkan pesan ke percakapan (untuk customer)
router.post(
    '/chat/message',
    authenticateJWT,
    authorize('create', 'Message'), // Pastikan user bisa mengirim pesan
    addMessageToConversation
);

// Endpoint untuk admin menambahkan pesan ke percakapan tertentu
router.post(
    '/chat/:conversationId/message',
    authenticateJWT,
    authorize('create', 'Message'), // Pastikan admin bisa mengirim pesan
    addMessageToConversationByAdmin
);

// Endpoint untuk mengambil semua pesan dalam percakapan
router.get(
    '/chat/:conversationId/messages',
    authenticateJWT,
    authorize('read', 'Message'), // Pastikan user bisa membaca pesan
    getMessagesByConversation
);

module.exports = router;
