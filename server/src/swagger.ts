import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Shipper Admin Dashboard API',
            version: '1.0.0',
            description: 'Admin Back-office API for the delivery platform',
        },
        servers: [{ url: '/api' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        paths: {
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login',
                    security: [],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', example: 'admin@shipper.com' },
                                        password: { type: 'string', example: 'admin123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'JWT token + user info' } },
                },
            },
            '/admin/stats/revenue': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'Revenue by period',
                    parameters: [
                        { name: 'from', in: 'query', schema: { type: 'string' } },
                        { name: 'to', in: 'query', schema: { type: 'string' } },
                        { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'] } },
                    ],
                    responses: { 200: { description: 'Revenue data' } },
                },
            },
            '/admin/stats/orders-summary': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'Orders summary counts',
                    responses: { 200: { description: 'Order counts by status' } },
                },
            },
            '/admin/drivers/online': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'Online drivers',
                    responses: { 200: { description: 'List of online drivers with locations' } },
                },
            },
            '/admin/orders': {
                get: {
                    tags: ['Orders'],
                    summary: 'List orders',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer' } },
                        { name: 'status', in: 'query', schema: { type: 'string' } },
                        { name: 'search', in: 'query', schema: { type: 'string' } },
                    ],
                    responses: { 200: { description: 'Paginated orders' } },
                },
            },
            '/admin/orders/{id}': {
                get: {
                    tags: ['Orders'],
                    summary: 'Get order detail',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Order detail' } },
                },
                patch: {
                    tags: ['Orders'],
                    summary: 'Update order',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Updated order' } },
                },
            },
            '/admin/orders/{id}/complaint': {
                patch: {
                    tags: ['Orders'],
                    summary: 'Update order complaint',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Updated order with complaint' } },
                },
            },
            '/admin/orders/{id}/audit': {
                get: {
                    tags: ['Orders'],
                    summary: 'Get order audit logs',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Audit logs' } },
                },
            },
            '/admin/pricing': {
                get: { tags: ['Pricing'], summary: 'List all pricing configs', responses: { 200: { description: 'Configs' } } },
                post: { tags: ['Pricing'], summary: 'Create pricing config', responses: { 201: { description: 'Created config' } } },
            },
            '/admin/pricing/active': {
                get: { tags: ['Pricing'], summary: 'Get active pricing config', responses: { 200: { description: 'Active config' } } },
            },
            '/admin/pricing/{id}/activate': {
                post: {
                    tags: ['Pricing'],
                    summary: 'Activate pricing config',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Activated config' } },
                },
            },
            '/admin/pricing/simulate': {
                post: {
                    tags: ['Pricing'],
                    summary: 'Simulate pricing',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        distanceKm: { type: 'number', example: 10 },
                                        serviceType: { type: 'string', example: 'express' },
                                        isBulky: { type: 'boolean', example: false },
                                        codAmount: { type: 'number', example: 500000 },
                                        timestamp: { type: 'string', example: '2024-01-15T08:00:00Z' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Pricing breakdown' } },
                },
            },
            '/admin/drivers': {
                get: { tags: ['Drivers'], summary: 'List drivers', responses: { 200: { description: 'Paginated drivers' } } },
            },
            '/admin/drivers/{id}': {
                get: {
                    tags: ['Drivers'],
                    summary: 'Get driver detail',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Driver detail' } },
                },
            },
            '/admin/drivers/{id}/approve': {
                patch: { tags: ['Drivers'], summary: 'Approve/reject driver', responses: { 200: { description: 'Updated driver' } } },
            },
            '/admin/drivers/{id}/lock': {
                patch: { tags: ['Drivers'], summary: 'Toggle driver lock', responses: { 200: { description: 'Updated driver' } } },
            },
            '/admin/drivers/cod/summary': {
                get: { tags: ['COD'], summary: 'COD summary', responses: { 200: { description: 'COD holding per driver' } } },
            },
            '/admin/drivers/cod/settle': {
                post: { tags: ['COD'], summary: 'Settle COD', responses: { 200: { description: 'Settlement record' } } },
            },
            '/admin/drivers/cod/settlements': {
                get: { tags: ['COD'], summary: 'Settlement history', responses: { 200: { description: 'Paginated settlements' } } },
            },
            '/admin/drivers/cod/export.csv': {
                get: { tags: ['COD'], summary: 'Export COD as CSV', responses: { 200: { description: 'CSV file' } } },
            },
        },
    },
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
