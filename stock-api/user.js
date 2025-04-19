import { v4 as uuidv4 } from 'uuid';
import { getHashOf } from './helper.js';
import { docClient } from './awsConfig.js';
import { ScanCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const tableName = 'users';


export async function userRegister(email, password, name) {
    const scanParams = { TableName: tableName };
    const rawData = await docClient.send(new ScanCommand(scanParams));
    const existingUser = rawData.Items.find(x => x.Email === email);

    if (!email.includes('@')) {
        return { error: 'invalid email' };
    }

    if (existingUser) {
        return { error: 'email already in use' };
    }

    for (const char of name) {
        if (char.toUpperCase() === char.toLowerCase() && char !== '-' && char !== "'" && char !== ' ') {
            return { error: 'invalid characters in name' };
        }
    }

    if (password.length < 8) {
        return { error: 'password too short' };
    }

    let charcheck = false;
    let num = false;

    for (const char of password) {
        if (/^[0-9]$/.test(char)) {
            num = true;
        } else if (char.toLowerCase() !== char.toUpperCase()) {
            charcheck = true;
        }
    }

    if (!charcheck || !num) {
        return { error: 'password is must contain upper and lowwerCase' };
    }

    password = getHashOf(password);
    const userId = uuidv4();

    const params = {
        TableName: tableName,
        Item: {
            Email: email,
            Username: name,
            Password: password,
            userId: userId,
            NotifiedService: false,
            LoggedIn: false
        },
    };

    try {
        await docClient.send(new PutCommand(params));
        return { userId: userId };
    } catch (error) {
        return { error: 'Database error' };
    }
}

export async function userLogin(email, password) {
    password = getHashOf(password);

    try {
        const scanParams = { TableName: tableName };
        const rawData = await docClient.send(new ScanCommand(scanParams));
        const user = rawData.Items.find(x => x.Email === email);

        if (!user) {
            return { error: 'Email address does not exist' };
        }
        if (user.Password !== password) {
            return { error: 'Password is not correct for the given email' };
        }

        const updatedField = {
            TableName: tableName,
            Key: { userId: user.userId },
            UpdateExpression: "SET LoggedIn = :trueVal",
            ExpressionAttributeValues: { ":trueVal": true },
        };

        await docClient.send(new UpdateCommand(updatedField));
        return { UserId: user.userId };
    } catch (error) {
        return { error: "Database error" };
    }
}