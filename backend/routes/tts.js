const express = require('express');
const router = express.Router();
const axios = require('axios');

// @desc    Generate Speech from Text using ElevenLabs
// @route   POST /api/tts
// @access  Public (Optional: Protect this to avoid abuse)
router.post('/', async (req, res) => {
    const { 
        text, 
        voiceId = '21m00Tcm4TlvDq8ikWAM', // Default: 'Rachel'
        stability = 0.5,
        similarity_boost = 0.75,
        style = 0.0,
        use_speaker_boost = true
    } = req.body;

    if (!text) {
        return res.status(400).json({ success: false, error: 'Please provide text' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'ElevenLabs API Key not configured' });
    }

    try {
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            data: {
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability,
                    similarity_boost,
                    style,
                    use_speaker_boost
                }
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        });

        res.send(Buffer.from(response.data));
    } catch (err) {
        const errorData = err.response?.data;
        let errorMessage = 'Failed to generate speech';
        
        if (errorData instanceof ArrayBuffer) {
            errorMessage = Buffer.from(errorData).toString();
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }

        console.error('ElevenLabs Error:', errorMessage);
        res.status(500).json({ success: false, error: errorMessage });
    }
});

module.exports = router;
