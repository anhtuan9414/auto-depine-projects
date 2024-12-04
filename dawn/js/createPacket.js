const MAX_HASH = 0xFFFFFFFF;
const UDP_CHUNK_SIZE = 128; 
const MESSAGE_TYPE_CHALLENGE_REQUEST = 1; 
const CHALLENGE_ID_LENGTH = 16; 
const HASH_SIZE_IN_BITS = 32; 

const INDEX_START_CHALLENGE_ID = 2; 
const INDEX_END_CHALLENGE_ID = INDEX_START_CHALLENGE_ID + CHALLENGE_ID_LENGTH - 1;
const INDEX_START_SEQUENCE_NUMBER = INDEX_END_CHALLENGE_ID + 1;
const INDEX_START_RANDOM_NUMBER = INDEX_START_SEQUENCE_NUMBER + 4;
const INDEX_PUBLIC_KEY_TYPE = INDEX_START_RANDOM_NUMBER + 4;
const INDEX_START_PUBLIC_KEY_LENGTH = INDEX_PUBLIC_KEY_TYPE + 1;
const INDEX_START_PUBLIC_KEY = INDEX_START_PUBLIC_KEY_LENGTH + 1;

const challenge_info = {
    "max_packets_per_challenger": 10 
};

const cryptoFactory = {
    CRYPTO_KEY_TYPE: {
        "type1": 1, 
        "type2": 2  
    }
};

// Initialize challenge ID (ensure you provide actual values)
const challenge_id_in_ascii = new Uint8Array([/* Initialize with appropriate values */]); 
const challenge_packets = new Array(challenge_info.max_packets_per_challenger);
const sent_random_number = new Map();

async function generateRandomNumber() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array); // Use the Web Crypto API to generate a random number
    return array[0] % (MAX_HASH + 1);
}

async function generate_UNSIGNED_challenge_packets(publicKey, keyType) {
    const publicKeyInAscii = new TextEncoder().encode(publicKey); // Use TextEncoder for ASCII encoding
    const maxPacketsPerChallenger = challenge_info["max_packets_per_challenger"] || 0;
    const keyTypeValue = cryptoFactory.CRYPTO_KEY_TYPE[keyType] || 0;
    const keyLength = publicKeyInAscii.length;
    const INDEX_END_PUBLIC_KEY = INDEX_START_PUBLIC_KEY + keyLength - 1;
    const INDEX_START_SIGNATURE_LENGTH = INDEX_END_PUBLIC_KEY + 1;

    for (let seq = 0; seq < maxPacketsPerChallenger; ++seq) {
        const random_number = await generateRandomNumber(); // Generate random number

        const message = new Uint8Array(UDP_CHUNK_SIZE);
        message[0] = MESSAGE_TYPE_CHALLENGE_REQUEST;
        message[1] = CHALLENGE_ID_LENGTH;

        for (let i = INDEX_START_CHALLENGE_ID; i <= INDEX_END_CHALLENGE_ID; ++i) {
            message[i] = challenge_id_in_ascii[i - INDEX_START_CHALLENGE_ID];
        }

        message.set(new Uint8Array([
            (seq & 0x000000FF),
            (seq & 0x0000FF00) >> 8,
            (seq & 0x00FF0000) >> 16,
            (seq & 0xFF000000) >> 24,
        ]), INDEX_START_SEQUENCE_NUMBER);

        message.set(new Uint8Array([
            (random_number & 0x000000FF),
            (random_number & 0x0000FF00) >> 8,
            (random_number & 0x00FF0000) >> 16,
            (random_number & 0xFF000000) >> 24,
        ]), INDEX_START_RANDOM_NUMBER);

        message[INDEX_PUBLIC_KEY_TYPE] = keyTypeValue;
        message[INDEX_START_PUBLIC_KEY_LENGTH] = keyLength;

        for (let i = INDEX_START_PUBLIC_KEY; i <= INDEX_END_PUBLIC_KEY; ++i) {
            message[i] = publicKeyInAscii[i - INDEX_START_PUBLIC_KEY];
        }

        message[INDEX_START_SIGNATURE_LENGTH] = 0;

        challenge_packets[seq] = message;
        sent_random_number.set(seq, random_number);
    }

    console.log(challenge_packets); // Log all packets after generation
    return challenge_packets; // Return all packets after loop
}

// Usage example
// const publicKey = '0x6784f65225f7d567Cf1535525b0DD720B1450D1B'; // Replace with actual public key
// const keyType = 'ethereum'; // Replace with actual key type

// generate_UNSIGNED_challenge_packets(publicKey, keyType).then((packets) => {
//     console.log('Generated Challenge Packets:', packets);
// });
