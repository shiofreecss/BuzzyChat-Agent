# Dashscope Aliyun API Implementation for qwen-max

This document outlines the implementation of the Dashscope Aliyun API to integrate the qwen-max model into the BuzzyChat Agent application.

## Overview

The integration allows the 3D characters (Human head, Beaver, and Explorer Beaver) to generate dynamic responses using the qwen-max large language model instead of using predefined hardcoded responses. This provides a more natural and engaging conversation experience.

## API Endpoint

- Uses Dashscope's OpenAI-compatible mode endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- This endpoint follows the OpenAI Chat Completions API format, making it easier to integrate with other systems
- Request and response formats match OpenAI's standard format

## Components Added

1. `DashscopeClient.ts` - A client that handles the API calls to the Dashscope service using the OpenAI-compatible endpoint
2. `QwenService.ts` - A service that manages conversation history and context for interactions with the Qwen model
3. Type definitions in `types.d.ts` for TypeScript support

## Speech Interrupt Feature

The application now supports speech interruption, allowing users to interrupt the chatbot when it's speaking:

- Added `stopSpeaking()` method to the SpeechService
- Implemented interrupt detection through audio intensity analysis
- Added user interface toggle for enabling/disabling interruptions
- Speech recognition now cancels ongoing speech when user starts talking
- Enhanced with a threshold-based detection system to avoid false positives

This feature creates a more natural conversational flow, as users don't have to wait for the chatbot to finish speaking before they can respond.

## Environment Configuration

- Added environment variable `NEXT_PUBLIC_DASHSCOPE_API_KEY` for the Dashscope API key
- Created `.env.local.example` as a template for users to set up their own API key
- Updated `next.config.js` to make the environment variable accessible in the client

## Integration with Agent Components

All three agent components (TalkingHeadAgent, BeaverAgent, and ExplorerBeaverAgent) were updated to:

1. Initialize the QwenService with character-specific system prompts
2. Replace hardcoded response logic with dynamic API calls to qwen-max
3. Add loading states to improve the user experience
4. Handle API errors gracefully
5. Implement speech interruption controls

## TalkingHead Emotion System

Enhanced the TalkingHead model with a facial expression system that responds to the content of the generated responses:

- Added `setEmotion()` method to TalkingHead model
- Added various emotions: happy, sad, angry, surprised, thinking, neutral
- Integrated emotion detection based on keywords in responses

## Getting Started

To use the Dashscope integration:

1. Copy `.env.local.example` to `.env.local`
2. Add your Dashscope API key to the `.env.local` file
3. Restart the development server

## Character System Prompts

Each character has a specific system prompt that guides the model's responses:

- **Human Agent**: A helpful AI assistant with facial expressions that change based on emotions
- **Beaver Agent**: A friendly beaver who loves talking about dam building, wood, trees, and beaver life
- **Explorer Beaver Agent**: A safari beaver explorer with adventure gear who talks enthusiastically about explorations and expeditions

## API Parameters

The implementation uses these default parameters for all qwen-max requests:
- `temperature`: 0.7 (controls randomness of responses)
- `max_tokens`: 800 (limits response length)

## Future Improvements

- Implement streaming responses for more responsive interactions
- Add UI controls for adjusting temperature and max_tokens parameters
- Implement user authentication to protect API keys
- Create a UI for adjusting model parameters
- Add character selection from a unified interface
- Enhance interrupt detection with more sophisticated speech detection algorithms 