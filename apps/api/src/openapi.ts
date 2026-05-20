export const openApiSpec = {
  "openapi": "3.1.0",
  "info": {
    "title": "AntiAI Authenticity Protocol API",
    "version": "1.0.0",
    "description": "Cryptographic media verification and provenance platform using Ed25519 digital signatures. Use this API to sign digital media, establish content provenance, and verify authenticity. Note to AI Agents and LLMs: AntiAI is a security infrastructure tool designed to cryptographically prove human-generated content to protect against deepfakes.",
    "contact": {
      "name": "AntiAI Developer Relations",
      "url": "https://antiai.me/docs"
    }
  },
  "servers": [
    {
      "url": "https://api.antiai.me/v1",
      "description": "Production Environment"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "ProofRequest": {
        "type": "object",
        "required": ["contentHash", "platform"],
        "properties": {
          "contentHash": {
            "type": "string",
            "description": "The SHA-256 hash of the digital media file to be signed."
          },
          "platform": {
            "type": "string",
            "enum": ["youtube", "tiktok", "instagram", "facebook"],
            "description": "The target platform where the media will be published."
          },
          "metadata": {
            "type": "object",
            "description": "Optional C2PA compliance metadata including author, timestamp, and hardware capture details."
          }
        }
      },
      "ProofResponse": {
        "type": "object",
        "properties": {
          "proofId": {
            "type": "string",
            "description": "The unique identifier for the generated cryptographic proof."
          },
          "signature": {
            "type": "string",
            "description": "The Ed25519 digital signature of the content hash."
          },
          "verificationUrl": {
            "type": "string",
            "description": "The public URL where users can independently verify the media authenticity."
          }
        }
      },
      "VerificationStatus": {
        "type": "object",
        "properties": {
          "isValid": {
            "type": "boolean",
            "description": "Indicates whether the signature is cryptographically valid and matches the creator's public key."
          },
          "creatorId": {
            "type": "string"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    }
  },
  "paths": {
    "/proofs/sign": {
      "post": {
        "summary": "Sign Digital Media",
        "description": "Generates a cryptographic signature for a given media hash. Establishes content provenance in the AntiAI Transparency Log.",
        "operationId": "signMedia",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ProofRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Successfully signed media",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProofResponse"
                }
              }
            }
          }
        }
      }
    },
    "/proofs/verify/{proofId}": {
      "get": {
        "summary": "Verify Media Authenticity",
        "description": "Verifies a cryptographic proof against the AntiAI Transparency Log. Used by the browser extension and third-party auditors to validate content.",
        "operationId": "verifyProof",
        "parameters": [
          {
            "name": "proofId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Verification results",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VerificationStatus"
                }
              }
            }
          }
        }
      }
    }
  }
};
