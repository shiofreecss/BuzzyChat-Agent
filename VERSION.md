# BuzzyChat Agent Version History

## v1.3.0 (Current)
Released: July 2023

### New Features
- Added new Mecha robot 3D model (mecha_04) in glTF format
  - Includes detailed textures and materials
  - Uses industry standard glTF format for better compatibility
  - Positioned as a technology/robotics character

### Improvements
- Implemented improved loader for glTF format models
- Enhanced animation system to support different model formats
- Further optimized language handling for better multilingual experience
- Added model credits section to documentation

## v1.2.0
Released: June 2023

### New Features
- Added support for multiple languages:
  - English (en-US)
  - Vietnamese (vi-VN)
  - Japanese (ja-JP)
  - Chinese (zh-CN)
- Implemented language selector dropdown in all agent UIs
- Added voice selector component to choose from available system voices
- Created test speech feature for verifying language and voice settings with sample phrases

### Improvements
- Optimized audio analysis for better performance:
  - Reduced FFT size from 256 to 128
  - Decreased animation frame rate from 60fps to 20fps
  - Improved sampling strategy for audio data
- Fixed language dropdown update issue (now updates immediately on selection)
- Enhanced voice selection algorithm to better match appropriate voices for each language

### Removed
- Removed speech interruption feature to improve stability and performance
- Eliminated related UI controls for toggling interruption

## v1.1.0
Released: April 2023

### New Features
- Added Explorer Beaver character with safari hat and accessories
- Implemented unique character prompts for each agent personality
- Added chat panel toggle for better mobile experience

### Improvements
- Enhanced facial expressions and animations
- Improved speech recognition accuracy
- Added loading indicator for 3D models
- Implemented typing animation effect for responses

## v1.0.0
Released: February 2023

### Initial Features
- Two 3D animated agents:
  - Talking Head with facial expressions
  - Beaver with animated mouth and tail
- Speech recognition using Web Speech API
- Text-to-speech response using Web Speech API
- AI-powered conversations with Dashscope's qwen-max model
- Real-time mouth animation synchronized with speech
- Basic speech interruption detection
- Responsive design for desktop and mobile devices 