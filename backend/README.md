# Chatbot Backend API

A comprehensive FastAPI backend for a chatbot application with OpenAI Responses API integration, local JSON storage, and LinkedIn profile scraping.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **OpenAI Responses API**: Chat responses using OpenAI's Responses API
- **Conversation Continuity**: Support for continuing conversations with optional ID
- **Local JSON Storage**: All messages saved to local `chats.json` file for persistence
- **Chat History**: Retrieve conversation history with pagination
- **Conversation Listing**: List all conversations with pagination and summaries
- **LinkedIn Profile Scraping**: Extract firstName and lastName from LinkedIn profiles
- **User Profile Storage**: All scraped LinkedIn profiles saved to `user.json`
- **Modular Architecture**: Clean separation of concerns with services, models, and configuration
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Health Checks**: Built-in health check endpoints
- **CORS Support**: Configurable Cross-Origin Resource Sharing
- **Environment Configuration**: Flexible configuration via environment variables

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration management
├── models.py            # Pydantic models for request/response
├── run.py               # Application startup script
├── services/            # Service layer
│   ├── __init__.py
│   └── openai_service.py
├── pyproject.toml       # Project dependencies and metadata
└── README.md           # This file
```

## Installation

1. **Install dependencies**:
   ```bash
   pip install -e .
   ```

2. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```bash
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Application Configuration (optional)
   APP_ENV=development
   LOG_LEVEL=INFO
   API_HOST=0.0.0.0
   API_PORT=8000
   API_RELOAD=true
   ALLOWED_ORIGINS=*
   ```

## Usage

### Starting the Server

**Option 1: Using the startup script**
```bash
python run.py
```

**Option 2: Using uvicorn directly**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Option 3: Using the main module**
```bash
python main.py
```

### API Endpoints

#### POST /messages
Create a new message or continue an existing conversation using OpenAI Responses API.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "id": "optional-previous-response-id"
}
```

**Response:**
```json
{
  "openai_id": "resp-123456789",
  "message": "Hello! I'm doing well, thank you for asking. How can I help you today?"
}
```

**Note:** 
- When an `id` is provided, it will be used as the `previous_response_id` parameter in the OpenAI Responses API call for conversation continuity.
- All messages (user and assistant) are automatically saved to `chats.json` for persistence.
- If no `id` is provided, a new conversation ID will be generated.

#### POST /linkedin-profile
Scrape LinkedIn profile to extract firstName and lastName.

**Request Body:**
```json
{
  "linkedinUrl": "https://www.linkedin.com/in/username/"
}
```

**Response:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Note:** 
- This endpoint uses the Apify LinkedIn scraper API to extract profile information. 
- The scraping may take a few seconds to complete.
- **All scraped profiles are automatically saved to `user.json` for record keeping.**

#### GET /chat
List all conversations with pagination, ordered from latest to oldest.

**Query Parameters:**
- `page` (int, optional): Page number (default: 1, minimum: 1)
- `limit` (int, optional): Conversations per page (default: 10, minimum: 1, maximum: 100)

**Example Request:**
```
GET /chat?page=1&limit=20
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "last_message": "Thank you for your help!",
      "last_message_timestamp": "2024-01-01T12:30:00.000Z",
      "message_count": 8,
      "last_role": "user"
    },
    {
      "id": "987f6543-e21c-34b5-a789-123456789abc",
      "last_message": "Hello! How can I help you today?",
      "last_message_timestamp": "2024-01-01T12:00:00.000Z", 
      "message_count": 2,
      "last_role": "assistant"
    }
  ],
  "total_conversations": 25,
  "page": 1,
  "limit": 20,
  "total_pages": 2,
  "has_next": true,
  "has_previous": false
}
```

#### GET /chat/{conversation_id}
Retrieve chat history for a specific conversation with pagination.

**Path Parameters:**
- `conversation_id` (string): The conversation ID

**Query Parameters:**
- `page` (int, optional): Page number (default: 1, minimum: 1)
- `limit` (int, optional): Messages per page (default: 10, minimum: 1, maximum: 100)

**Example Request:**
```
GET /chat/123e4567-e89b-12d3-a456-426614174000?page=1&limit=20
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "openai_id": null
    },
    {
      "id": "msg-uuid-2", 
      "role": "assistant",
      "content": "Hello! I'm doing well, thank you for asking.",
      "timestamp": "2024-01-01T12:00:01.000Z",
      "openai_id": "resp-123456789"
    }
  ],
  "total_messages": 2,
  "page": 1,
  "limit": 20,
  "total_pages": 1,
  "has_next": false,
  "has_previous": false
}
```

#### GET /health
Get detailed health check information.

**Response:**
```json
{
  "status": "healthy",
  "openai_client": "initialized",
  "api_key_configured": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Chatbot Backend API is running"
}
```

### API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuration

The application uses environment variables for configuration. You can override defaults by setting these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | "" | Your OpenAI API key (required) |
| `APP_ENV` | "development" | Application environment |
| `LOG_LEVEL` | "INFO" | Logging level |
| `API_HOST` | "0.0.0.0" | Server host |
| `API_PORT` | 8000 | Server port |
| `API_RELOAD` | true | Auto-reload on code changes |
| `ALLOWED_ORIGINS` | "*" | CORS allowed origins (comma-separated) |
| `DEFAULT_MODEL` | "gpt-4o" | OpenAI model to use |
| `DEFAULT_TEMPERATURE` | 1.0 | Model temperature |
| `DEFAULT_MAX_TOKENS` | 2048 | Maximum tokens in response |
| `DEFAULT_TOP_P` | 1.0 | Top-p sampling parameter |

## Development

### Adding New Features

1. **Models**: Add new Pydantic models in `models.py`
2. **Services**: Create new services in the `services/` directory
3. **Endpoints**: Add new endpoints in `main.py`
4. **Configuration**: Add new settings in `config.py`

### Error Handling

The application includes comprehensive error handling:
- HTTP exceptions are properly formatted
- OpenAI API errors are caught and re-raised as HTTP exceptions
- All errors include timestamps and detailed messages

### Logging

Logs include:
- Request processing information
- OpenAI API call details
- Error messages with stack traces
- Service initialization status

## Production Considerations

1. **Security**:
   - Set `ALLOWED_ORIGINS` to specific domains
   - Use environment variables for sensitive configuration
   - Consider adding authentication/authorization

2. **Performance**:
   - Use a production ASGI server like Gunicorn with Uvicorn workers
   - Implement rate limiting
   - Add caching for frequent requests

3. **Monitoring**:
   - Set up proper logging aggregation
   - Add metrics collection
   - Implement health check monitoring

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**:
   - Ensure `OPENAI_API_KEY` is set in your environment
   - Verify the API key is valid and has sufficient credits

2. **Import Errors**:
   - Make sure all dependencies are installed: `pip install -e .`
   - Check Python version compatibility (requires Python 3.12+)

3. **Port Already in Use**:
   - Change the `API_PORT` environment variable
   - Kill any existing processes using the port

### Logs

Check the application logs for detailed error information. The default log level is INFO, but you can set it to DEBUG for more verbose output.

## Data Storage

### Local JSON Storage
All chat messages are automatically saved to a local `chats.json` file in the backend directory. The file structure is:

```json
{
  "conversations": {
    "conversation-id-1": {
      "messages": [
        {
          "id": "message-uuid",
          "role": "user",
          "content": "User message",
          "timestamp": "2024-01-01T12:00:00.000000",
          "openai_id": null
        },
        {
          "id": "message-uuid",
          "role": "assistant", 
          "content": "Assistant response",
          "timestamp": "2024-01-01T12:00:01.000000",
          "openai_id": "resp-123456789"
        }
      ]
    }
  }
}
```

### User Profile Storage
All scraped LinkedIn profiles are saved to a local `user.json` file in the backend directory. The file structure is:

```json
{
  "profiles": [
    {
      "id": 1,
      "profileUrl": "https://www.linkedin.com/in/username/",
      "firstName": "John",
      "lastName": "Doe",
      "timestamp": "2024-01-01T12:00:00.000000"
    },
    {
      "id": 2,
      "profileUrl": "https://www.linkedin.com/in/another-user/",
      "firstName": "Jane",
      "lastName": "Smith", 
      "timestamp": "2024-01-01T12:30:00.000000"
    }
  ]
}
```

### Benefits
- **Persistence**: Messages and profiles survive server restarts
- **History**: Full conversation and profile scraping history available
- **Debugging**: Easy to inspect stored conversations and scraped profiles
- **Backup**: Simple file-based backup and recovery
- **Audit Trail**: Track all LinkedIn profile scraping activities with timestamps