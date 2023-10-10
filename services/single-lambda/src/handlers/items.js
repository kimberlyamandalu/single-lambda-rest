const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;
const { getItem, putItem, deleteItem } = require("../helpers/dynamo");
const { randomUUID } = require("crypto");

const handler = async (event) => {
    try {
        const method = event?.httpMethod;
        const keySchema = {"PK":"id"};
        const cognitoUserId = event.requestContext?.authorizer?.claims?.sub;
        let responseData;
        let responseStatusCode;
        // Catch POST Requests
        if (method === "POST") {
            const item = JSON.parse(event.body);
            const id = randomUUID();
            const now = new Date().toISOString();

            const Item = {
                [keySchema.PK]: id,
                ...item,
                createdAt: now,
                updatedAt: now
            };

            if (cognitoUserId) Item.cognitoUserId = cognitoUserId;
            await putItem(TableName, Item);
            responseData = Item;
            responseStatusCode = 201;
        }

        // Catch GET Requests
        else if (method === "GET") {
            const id = event.pathParameters?.id;
            if (!id) throw { statusCode: 400, message: "invalid param" };
            let Item = {
                [keySchema.PK]: id
            };
            const ddbRes = await getItem(TableName, Item);
            if (!ddbRes.Item)
                throw {
                    statusCode: 400,
                    message: "Item not found"
                };
            responseData = ddbRes.Item;
            responseStatusCode = 200;
        }

        // Catch PUT and PATCH Requests
        else if (method === "PUT" || method === "PATCH") {
            const id = event.pathParameters?.id;
            if (!id) {
                throw { statusCode: 400, message: "invalid param" };
            }
            const now = new Date().toISOString();
            const item = JSON.parse(event.body);
            let Item = {
                [keySchema.PK]: id,
                ...item,
                updatedAt: now
            };
            if (cognitoUserId) Item.cognitoUserId = cognitoUserId;
            await putItem(TableName, Item);
            responseData = { message: "success" };
            responseStatusCode = 200;
        }

        // catch DELETE Requests
        else {
            const id = event.pathParameters?.id;
            if (!id) {
                throw { statusCode: 400, message: "invalid param" };
            }
            let Item = {
                [keySchema.PK]: id
            };

            await deleteItem(TableName, Item);
            responseData = { message: "success" };
            responseStatusCode = 204;
        }
        return buildResponse(responseStatusCode, responseData);
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
