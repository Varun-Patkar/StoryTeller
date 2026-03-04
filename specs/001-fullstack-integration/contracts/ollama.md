# Contract: Local Ollama Streaming

**Version**: 1.0.0  
**Purpose**: Define how the frontend streams text from the local Ollama engine

---

## POST http://localhost:11434/api/generate

**Purpose**: Stream model output tokens directly to the frontend

**Request Body**:
```json
{
  "model": "llama3.1:8b",
  "prompt": "Write the opening to a mystical tale...",
  "stream": true,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

**Response**: NDJSON stream
```
{"response":"Once ","done":false}
{"response":"upon ","done":false}
{"response":"a time...","done":false}
{"done":true}
```

**Error Handling**:
- Network/CORS failures surface as `fetch` network errors
- Non-2xx responses return HTTP status with optional error text
