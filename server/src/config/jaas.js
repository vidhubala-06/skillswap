const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const privateKey = fs.readFileSync(
    path.join(__dirname, '../../', process.env.JAAS_PRIVATE_KEY_PATH),
    'utf8'
);

function generateJaasToken({ roomName, userName }) {
    const payload = {
        aud: 'jitsi',
        iss: 'chat',
        sub: process.env.JAAS_APP_ID,
        room: '*',
        nbf: Math.floor(Date.now() / 1000) - 5,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour validity
        context: {
            user: {
                name: userName,
                moderator: true
            },
            features: {
                livestreaming: false,
                recording: false,
                transcription: false
            }
        }
    };

    return jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        header: {
            kid: process.env.JAAS_API_KEY_ID,
            typ: 'JWT',
            alg: 'RS256'
        }
    });
}

module.exports = { generateJaasToken };