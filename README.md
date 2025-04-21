# BuzzyChat Agent

A 3D talking agent created with Next.js, Three.js, Web Speech API, and Dashscope Aliyun's qwen-max model.

## Version

v1.3.0 - Added new Mecha model and continued multilingual support improvements

## Features

- Two 3D animated agents:
  - Human head with facial expressions
  - New Mecha robot in glTF format with detailed textures
- Speech recognition using the Web Speech API
- Text-to-speech response using the Web Speech API
- AI-powered responses using Dashscope's qwen-max model
- Real-time mouth animation synchronized with speech
- Multiple language support (English, Vietnamese, Japanese, Chinese)
- Custom voice selection for each language
- Testing tools for speech synthesis
- Navigate between different agent characters
- Conversation history maintained within sessions
- Optimized performance for smooth 3D rendering during speech

## Prerequisites

- Node.js 16+ and npm
- Dashscope Aliyun API key (for qwen-max model)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Copy the `.env.local.example` file to `.env.local` and add your Dashscope API key:

```
NEXT_PUBLIC_DASHSCOPE_API_KEY=your_dashscope_api_key_here
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying to Netlify

Follow these steps to deploy the application to Netlify:

1. Push your code to a GitHub repository
2. Log in to [Netlify](https://www.netlify.com/) and click "New site from Git"
3. Select your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add your environment variables:
   - Go to Site settings > Build & deploy > Environment > Environment variables
   - Add `NEXT_PUBLIC_DASHSCOPE_API_KEY` with your API key
6. Click "Deploy site"

The netlify.toml file in the repository already contains the necessary configuration for deployment.

## How to Use

1. Choose between the human agent or the Mecha robot using the navigation links
2. Select your preferred language from the dropdown menu (English, Vietnamese, Japanese, Chinese)
3. Choose a voice for the selected language using the voice selector
4. Click the "Start Listening" button to begin voice recognition
5. Speak into your microphone (make sure to allow microphone access when prompted)
6. The 3D agent will respond verbally and animate while speaking
7. Use the test speech feature to verify voice synthesis in different languages
8. Your conversation will be displayed in the interface below or beside the 3D model

### Talking with the Mecha Robot

The Mecha Robot can talk about:
- Advanced technology and robotics
- Artificial intelligence
- Space exploration and science fiction
- Its mechanical features and capabilities
- Futuristic scenarios and concepts

## Tech Stack

- **Next.js**: React framework for the application
- **TypeScript**: For type safety
- **Three.js**: For 3D rendering of the talking agents
- **Web Speech API**: For speech recognition and synthesis
- **Dashscope API**: For AI-powered responses using qwen-max
- **TailwindCSS**: For styling

## Recent Updates

### v1.3.0
- Added new Mecha robot 3D model in glTF format with detailed textures
- Improved model loading performance for glTF files
- Enhanced language support for more consistent multilingual experience
- Further optimized animation performance
- Added expanded support for multiple languages including improved translations
- Implemented enhanced voice selection with more natural-sounding options
- Optimized voice processing for smoother multilingual conversations
- Removed Beaver and Explorer Beaver agents to focus development on human and Mecha models
- Added Netlify deployment support with configuration files

### v1.2.0
- Added support for multiple languages (English, Vietnamese, Japanese, Chinese)
- Added voice selector for choosing different speech synthesis voices
- Implemented test speech feature for verifying language and voice settings
- Optimized audio analysis for better performance with 3D models
- Reduced CPU usage during speech recognition and animation
- Fixed language dropdown update issues

### v1.1.0
- Added Explorer Beaver character with safari hat and accessories
- Improved speech interruption detection
- Enhanced facial expressions and animations

### v1.0.0
- Initial release with Talking Head and Beaver agents
- Speech recognition and synthesis integration
- AI response generation with qwen-max

## Browser Compatibility

This application uses the Web Speech API, which has varying levels of support across browsers:

- Chrome: Full support
- Edge: Good support
- Firefox: Partial support
- Safari: Limited support

For the best experience, use Google Chrome.

## Language Support

Language support depends on your browser's implementation of the Web Speech API:
- English has the best overall support across browsers
- Vietnamese, Japanese, and Chinese support varies by browser
- Use the voice selector to find the best voice for each language
- The test speech feature helps verify language and voice compatibility

## 3D Model Credits

- Mecha Robot model (mecha_04): Downloaded from Sketchfab, used with appropriate license
- Other models created and customized for BuzzyChat

## Project Structure

- `/components`: React components including the TalkingHeadAgent and MechaAgent
- `/lib`: Utility functions and services, including the SpeechService, QwenService, and DashscopeClient
- `/models`: Contains the 3D model classes for the TalkingHead and Mecha models
- `/pages`: Next.js pages
- `/public`: Static assets including 3D models
  - `/public/3d-models`: Contains the 3D model files (.glb and .gltf)
- `/styles`: CSS styles

## Limitations

- The Web Speech API requires an internet connection
- Speech recognition quality varies based on microphone and background noise
- Language support depends on browser implementation and available voices
- The Dashscope API requires an API key and internet connection
- API rate limits may apply depending on your Dashscope subscription
- Large 3D models might affect performance on lower-end devices

## License

MIT 