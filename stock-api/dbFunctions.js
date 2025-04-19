import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { docClient } from './awsConfig.js';
import { ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

export async function CreateTables() {
  if (
    (await tableExists('stocks')) &&
    (await tableExists('users'))
  ) {
    console.log(`Tables already exist. Skipping creation.`);
    return;
  }

  try {
    await createTableIfNotExists('users');
    await createTableIfNotExists('stocks');
    console.log('Tables created successfully');
  } catch (err) {
    if (err.code === 'ResourceInUseException') {
      console.log('Tables already exist, proceeding...');
    } else {
      console.error('Error creating tables:', err);
      throw err;
    }
  }
}

function getTableParams(tableName) {
  if (tableName === 'users') {
    return {
      TableName: 'users',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 6, WriteCapacityUnits: 6 },
    };
  } else if (tableName === 'stocks') {
    return {
      TableName: 'stocks',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'symbol', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'symbol', AttributeType: 'S' },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };
  } else {
    throw new Error(`Unknown table name: ${tableName}`);
  }
}

// Create a single table with existence check and wait
const createTableIfNotExists = async (tableName) => {
  const params = getTableParams(tableName);

  if (await tableExists(tableName)) {
    console.log(`Table '${tableName}' already exists. Skipping creation.`);
    return;
  }

  try {
    await docClient.send({ command: 'CreateTable', ...params }); 
    await waitForTable(tableName);
    console.log(`Table '${tableName}' created successfully`);
  } catch (err) {
    if (err.code === 'ResourceInUseException') {
      console.log(`Table '${tableName}' already exists, proceeding...`);
    } else {
      console.error(`Error creating table '${tableName}':`, err);
      throw err;
    }
  }
};

async function tableExists(tableName) {
  try {
    await docClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function waitForTable(tableName) {
  let tableReady = false;
  while (!tableReady) {
    try {
      const data = await docClient.send(new DescribeTableCommand({ TableName: tableName }));
      if (data.Table.TableStatus === 'ACTIVE') {
        tableReady = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.log(`Table ${tableName} is active`);
}

export async function DeleteTables() {
  const portfolioParams = { TableName: 'users' };
  const stocksParams = { TableName: 'stocks' };

  try {
    await docClient.send({ command: 'DeleteTable', ...portfolioParams });
    await docClient.send({ command: 'DeleteTable', ...stocksParams });
    console.log('Tables deleted successfully');
  } catch (err) {
    console.error('Error deleting tables:', err);
    throw err;
  }
}

export async function resetTable() {
  const tableName = 'users';
  try {
    let scanParams = { TableName: tableName };
    let data;
    do {
      data = await docClient.send(new ScanCommand(scanParams));
      if (!data.Items || data.Items.length === 0) {
        console.log('No items to delete.');
        return { message: 'Table is already empty' };
      }
      const deleteRequests = data.Items.map((item) => ({
        DeleteRequest: { Key: { userId: item.userId } }
      }));
      const batchParams = {
        RequestItems: { [tableName]: deleteRequests },
      };
      await docClient.send(new BatchWriteCommand(batchParams));
      scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (data.LastEvaluatedKey);
    console.log('All items deleted successfully.');
    return { message: 'Table reset successful' };
  } catch (error) {
    console.error('Error resetting table:', error);
    return { error: 'Failed to reset table' };
  }
}