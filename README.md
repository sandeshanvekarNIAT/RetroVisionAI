# 🔄 AI Reverse-Invention Generator

> *Reimagine history by discovering how modern inventions could have emerged in different eras*

An AI-powered platform that takes existing inventions (like smartphones, computers, or steam engines) and imagines alternate historical pathways for how they could have been developed centuries earlier, complete with AI-generated visuals and historical narratives.

## 🌟 Features

### Core Capabilities
- **🔬 Invention Deconstruction**: AI breaks down any invention into fundamental components, materials, and dependencies
- **⏰ Timeline Simulation**: Generate 3-4 alternate pathways showing how inventions could have emerged in different eras  
- **🎨 Visual Generation**: DALL-E creates period-accurate visualizations of alternate prototypes
- **📜 Historical Narratives**: AI writes detailed "history book entries" as if the invention actually existed
- **🎤 Voice Input**: Record your invention ideas using speech-to-text
- **📊 Export**: Download complete analyses as PowerPoint presentations

### Educational & Creative Applications
- **Education**: Interactive learning about science, history, and technology dependencies
- **Innovation**: Discover missed opportunities to inspire new product ideas  
- **Entertainment**: Generate alternate history content for storytelling and world-building
- **Research**: Explore technological development patterns and constraints

## 🚀 Quick Start

### For Replit Users (Recommended)

1. **Fork this project** in Replit
2. **Add your OpenAI API key**:
   - Go to "Secrets" tab in Replit
   - Add key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
3. **Click Run** - that's it!

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd reverse-invention-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev
```

## 🎯 Example Usage

**Input**: "Smartphone" + "1800s"

**Output**:
- **Decomposition**: Battery tech, display systems, communication protocols, miniaturization
- **Pathway 1**: "Telegraph Phone" - Mechanical keyboard + telegraph network + primitive batteries
- **Pathway 2**: "Optical Communicator" - Mirror-based light signals + hand-cranked power
- **Pathway 3**: "Steam-Powered Messenger" - Pneumatic tube system + automated switching
- **Generated Images**: Victorian-era brass and wood prototypes with detailed blueprints
- **Historical Narrative**: 350-word "history book" entry about the invention's social impact

## 📋 API Endpoints

### Core Analysis
- `POST /api/deconstruct` - Break down invention into components
- `POST /api/simulate` - Generate alternate timeline pathways  
- `POST /api/generate-image` - Create DALL-E visualizations
- `POST /api/narrative` - Generate historical narrative text
- `POST /api/transcribe` - Voice-to-text for audio input
- `POST /api/export` - Export results as PPTX

### System
- `GET /api/health` - System status and configuration check
- `GET /api/cache-stats` - Cache performance metrics

## 🔧 Configuration

### Required Environment Variables
```bash
OPENAI_API_KEY=sk-...  # Your OpenAI API key
```

### Optional Configuration
```bash
GPT_MODEL=gpt-4o-mini           # GPT model for analysis (default: gpt-4o-mini)
IMAGE_MODEL=dall-e-3            # Image model (default: dall-e-3) 
PORT=8080                       # Server port (default: 8080)
NODE_ENV=production             # Environment mode

# Advanced: Neo4j for knowledge graphs (future feature)
NEO4J_URI=neo4j+s://...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
```

## 💰 Cost Management

The app includes several cost control features:
- **Smart Caching**: Results cached to avoid repeated API calls
- **Rate Limiting**: Prevents API abuse (configurable)
- **Model Selection**: Uses cost-effective models by default
- **User Confirmation**: Images generated only when requested

**Estimated Costs** (OpenAI pricing):
- Deconstruction: ~$0.01 per analysis
- Simulation: ~$0.02-0.05 per set of pathways  
- Images: ~$0.04 per DALL-E image
- Complete analysis: ~$0.10-0.20 per invention

## 🔒 Security Features

- **Input Moderation**: OpenAI moderation + keyword filtering
- **Rate Limiting**: IP-based request limiting  
- **API Key Protection**: Server-only API access
- **Input Sanitization**: Validates and cleans all user input

## 🧪 Testing

### Manual Test
1. Enter "Smartphone" as invention
2. Select "1800s" as era  
3. Set creativity to 0.8
4. Click "Generate Alternate History"
5. Verify you get 3-4 pathways with feasibility scores
6. Generate images and download PPTX

### Expected Results
- Decomposition with batteries, display, communication components
- Pathways like "Telegraph Phone", "Mechanical Communicator"  
- Images showing Victorian-era brass/wood prototypes
- Downloadable presentation with all content

## 🚀 Future Enhancements

### Advanced Features (Roadmap)
- **Neo4j Integration**: Knowledge graph for technology dependencies
- **VR/AR Museums**: Immersive alternate history experiences  
- **Collaboration Mode**: Team-based invention exploration
- **Enterprise R&D**: Patent research and product ideation tools
- **Marketplace**: Community sharing of alternate inventions

### Technical Improvements
- **Streaming Responses**: Real-time generation updates
- **Advanced Caching**: Persistent storage with Supabase/Firebase
- **Multi-language Support**: Global accessibility
- **Mobile App**: Native iOS/Android versions

## 📊 Architecture

```
Frontend (React/Vite)
├── InputForm: User interface and voice input
├── ResultsView: Analysis display with tabs
├── ImageCard: Visual generation and display
└── TimelineSlider: Interactive era selection

Backend (Express/Node.js)  
├── OpenAI Integration: GPT + DALL-E + Whisper
├── Caching Layer: In-memory with node-cache
├── Rate Limiting: Request throttling
└── Export System: PPTX generation

External Services
├── OpenAI API: Text, image, and audio processing
└── Optional: Neo4j for knowledge graphs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- **Issues**: [GitHub Issues](../../issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our Discord for discussions and support

---

**Built with ❤️ for curious minds who want to reimagine the past to inspire the future**

*"Every invention is just the right combination of existing pieces assembled at the right moment in history"*