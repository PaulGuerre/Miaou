import axios from "axios";

export const getMistralResponse = async (audioBase64: string) => {
    try {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/ios-upload`, {
            audio: audioBase64,
            filename: 'recording.m4a',
            mimetype: 'audio/m4a'
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};
