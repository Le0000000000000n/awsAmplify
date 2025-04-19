import { createHash } from 'crypto';

export function getHashOf(plaintext) {
    return createHash('sha256').update(plaintext).digest('hex');
}

export function createInitialJsonObjectHead(s3Location) {
    return {
        data_source: "mango-tango-stocks-data ",
        dataset_type: "stock_history",
        dataset_id: s3Location,
        time_object: {
            timestamp: Math.floor((new Date()).getTime() / 1000),
            timezone: "UTC"
        },
        events: []
    };
}