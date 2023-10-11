const {
	putItem,
	getItem,
	deleteItem
} = require('../../../services/single-lambda/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/single-lambda/src/helpers/response')
const { handler } = require('../../../services/single-lambda/src/handlers/items')

// hardcode the
const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"id"}

jest.mock('../../../services/single-lambda/src/helpers/dynamo')
jest.mock('../../../services/single-lambda/src/helpers/response')

describe('Test lambda with many routes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should create an Item and return a 201 response', async () => {
		const event = require('../../../events/createItemById.json')

		const item = JSON.parse(event.body)
		const cognitoUserId = event.requestContext.authorizer.claims.sub

		const expectedItem = expect.objectContaining({
			...item,
			[keySchema.PK]: expect.any(String),
			cognitoUserId,
			createdAt: expect.any(String),
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(201, expectedItem)

		putItem.mockResolvedValueOnce({})

		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(event)
		expect(putItem).toHaveBeenCalledTimes(1)
		expect(putItem).toHaveBeenCalledWith(TableName, expectedItem)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(201, expectedItem)
	})
	it('should get an Item and return a 200 response', async () => {
		const event = require('../../../events/getItemById.json')

		const id = event.pathParameters?.id
		const cognitoUserId = event.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: id
		}

		const expectedItem = expect.objectContaining({
			[keySchema.PK]: id,
			cognitoUserId,
			productName: expect.any(String),
			productPrice: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(200, expectedItem)

		getItem.mockResolvedValueOnce({ Item: expectedItem })

		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(event)

		expect(getItem).toHaveBeenCalledTimes(1)
		expect(getItem).toHaveBeenCalledWith(TableName, Item)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedItem)
	})
	it('should update and Item and return a 200 response', async () => {
		const event = require('../../../events/updateItemById.json')

		const id = event.pathParameters?.id
		const cognitoUserId = event.requestContext.authorizer.claims.sub

		const item = JSON.parse(event.body)
		const expectedItem = expect.objectContaining({
			...item,
			[keySchema.PK]: id,
			cognitoUserId,
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(200, { message: 'success' })

		putItem.mockResolvedValueOnce({})

		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(event)

		expect(putItem).toHaveBeenCalledTimes(1)
		expect(putItem).toHaveBeenCalledWith(TableName, expectedItem)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, { message: 'success' })
	})

	it('should delete an Item and return a 204 response', async () => {
		const event = require('../../../events/deleteItemById.json')

		const id = event.pathParameters?.id

		const Item = {
			[keySchema.PK]: id
		}

		const expectedResponse = buildResponse(204, { message: 'success' })

		deleteItem.mockResolvedValueOnce({})

		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(event)

		expect(deleteItem).toHaveBeenCalledTimes(1)
		expect(deleteItem).toHaveBeenCalledWith(TableName, Item)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(204, { message: 'success' })
	})

	it('should return a 400 error response if the path parameter is empty', async () => {
		const invalidEvent = {
			httpMethod: 'DELETE',
			requestContext: {
				authorizer: {
					claims: {
						sub: '1234abcd'
					}
				}
			},
			pathParameters: {}
		}

		const expectedError = { statusCode: 400, message: 'invalid param' }
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(invalidEvent)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})

	it('should return a 400 error response if the path parameter is empty', async () => {
		const invalidEvent = {
			httpMethod: 'UPDATE',
			requestContext: {
				authorizer: {
					claims: {
						sub: '1234abcd'
					}
				}
			},
			pathParameters: {}
		}

		const expectedError = { statusCode: 400, message: 'invalid param' }
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(invalidEvent)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
	it('should return a 400 error response if the path parameter is empty', async () => {
		const invalidEvent = {
			httpMethod: 'GET',
			requestContext: {
				authorizer: {
					claims: {
						sub: '1234abcd'
					}
				}
			},
			pathParameters: {}
		}

		const expectedError = { statusCode: 400, message: 'invalid param' }
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(invalidEvent)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
	it('should return a 400 error if the item is not found', async () => {
		const event = require('../../../events/getItemById.json')

		const expectedError = { statusCode: 400, message: 'Item not found' }

		getItem.mockRejectedValueOnce(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(event)
		
		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})

	it('should return a 500 error response if the server is down', async () => {
		const event = require('../../../events/createItemById.json')

		const error = new Error('server error')
		error.statusCode = 500

		errorResponse.mockReturnValue({
			statusCode: 500,
			message: error.message
		})

		putItem.mockRejectedValueOnce({ error })

		const result = await handler(event)

		expect(result).toEqual(errorResponse(error))
	})
})
