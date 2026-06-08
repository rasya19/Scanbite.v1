import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK securely using backend environment variable
// Always checks for API key presence to handle startup gracefully
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Peringatan: GEMINI_API_KEY tidak ditemukan di environment. Menjalankan fallback simulasi.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// 1. AI Sommelier / Recommendation Endpoint
app.post("/api/sommelier", async (req, res) => {
  const { prompt, userPreferredCategory, budgetMax, activeMenu } = req.body;
  
  const ai = getGeminiClient();

  if (!ai) {
    // Elegant fallback simulation in case the API key is not configured yet
    setTimeout(() => {
      res.json({
        text: `**Virtual Sommelier (Simulated Mode):** Halo! Saya pendamping kuliner Anda di ScanBite. Tampaknya kunci API Gemini belum terkonfigurasi pada file rahasia (Secrets) proyek Anda.\n\nNamun, berdasarkan keinginan Anda (${prompt || 'menu segar'}), saya sangat menyarankan mencoba **Classic Tiramisu Melt** dipadukan dengan **Salted Caramel Hazelnut** atau **Es Kopi Susu Aren Klasik** kami yang segar. Perpaduan manis alami aren dan kopi berkualitas tinggi kami pasti akan memanjakan lidah Anda hari ini!`
      });
    }, 1000);
    return;
  }

  try {
    const formattedMenu = JSON.stringify(activeMenu || []);
    const systemPrompt = `Anda adalah seorang Senior Cafe Sommelier, Barista, dan Culinary Advisor profesional di kafe moder bernama 'ScanBite'.
Tugas Anda adalah memandu pelanggan memilih hidangan, cokelat, atau kopi terbaik dari menu yang tersedia di kafe kami berdasarkan kebutuhan, budget, atau situasi hati (mood) mereka.

Berikut adalah daftar menu aktif saat ini di kafe kami:
${formattedMenu}

Panduan perilaku Anda:
- Jawablah dalam bahasa Indonesia yang ramah, sopan, puitis, dan profesional layaknya barista premium.
- Sesuaikan saran Anda dengan budget maksimal pelanggan (jika diberikan, budgetMax: Rp ${budgetMax || "bebas"}).
- Rekomendasikan nama produk eksak yang tercantum pada menu di atas agar mereka dapat langsung mengkliknya.
- Jelaskan rasa pas, paduan tekstur, dan mengapa paduan rasa itu istimewa.
- Berikan saran penyajian yang elegan.
- Berikan respon yang ringkas, mudah dibaca dengan pemformatan Markdown modern (bullet-points, bold text).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt || "Berikan rekomendasi menu terbaik untuk makan siang santai berdua.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Kesalahan panggilan API Gemini:", error);
    res.status(500).json({ 
      error: "Gagal memproses rekomendasi AI.",
      details: error.message || String(error)
    });
  }
});

// ==========================================
// DIGITAL JUKEBOX SYSTEM API INTEGRATIONS
// ==========================================

let spotifyAccessToken = '';
let spotifyTokenExpiresAt = 0;

// Helper to authenticate client credentials flow on Spotify API
async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }

  if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt) {
    return spotifyAccessToken;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json() as any;
    if (data && data.access_token) {
      spotifyAccessToken = data.access_token;
      spotifyTokenExpiresAt = Date.now() + (Number(data.expires_in) - 60) * 1000;
      return spotifyAccessToken;
    }
  } catch (err) {
    console.error('Error authenticating with Spotify API:', err);
  }
  return null;
}

// 2. Jukebox Config & API Integration Status Checking
app.get("/api/jukebox/config", (req, res) => {
  res.json({
    spotifyConfigured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    youtubeConfigured: !!process.env.YOUTUBE_API_KEY,
    fallbackEngine: "iTunes Music Search engine (Automatic with artwork metadata)",
    currentLocalTime: new Date()
  });
});

// 3. Jukebox Core Music Search API (Spotify vs YouTube vs Fallback)
app.get("/api/jukebox/search", async (req, res) => {
  const query = req.query.q as string || '';
  const provider = (req.query.provider as string || 'spotify').toLowerCase();

  if (!query.trim()) {
    return res.json({ results: [] });
  }

  console.log(`🎵 Jukebox Search: [${provider.toUpperCase()}] "${query}"`);

  // --- CASE A: SPOTIFY API (Live Credentials) ---
  if (provider === 'spotify') {
    const spotifyToken = await getSpotifyToken();
    if (spotifyToken) {
      try {
        const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
        const response = await fetch(spotifyUrl, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.tracks && data.tracks.items) {
            const mapped = data.tracks.items.map((item: any) => {
              const durationMs = item.duration_ms || 0;
              const minutes = Math.floor(durationMs / 60000);
              const seconds = Math.floor((durationMs % 60000) / 1000);
              const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              
              return {
                id: item.id,
                title: item.name,
                artist: item.artists?.[0]?.name || 'Unknown Artist',
                duration: durationStr,
                artworkUrl: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&fit=crop',
                spotifyUri: item.uri || `spotify:track:${item.id}`,
                youtubeId: ''
              };
            });
            return res.json({ results: mapped, source: 'spotify_live_api' });
          }
        }
      } catch (err) {
        console.warn('Live Spotify search failed, jumping to fallback:', err);
      }
    }
  }

  // --- CASE B: YOUTUBE API (Live Credentials) ---
  if (provider === 'youtube' && process.env.YOUTUBE_API_KEY) {
    try {
      const ytApiKey = process.env.YOUTUBE_API_KEY;
      const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query + " official audio")}&type=video&key=${ytApiKey}`;
      
      const response = await fetch(youtubeUrl);
      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.items) {
          const mapped = data.items.map((item: any) => {
            return {
              id: item.id?.videoId || 'dQw4w9WgXcQ',
              title: item.snippet?.title || 'Unknown Title',
              artist: item.snippet?.channelTitle || 'Unknown Creator',
              duration: '3:45', // Duration is not in standard youtube search snippet, safe default
              artworkUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&fit=crop',
              spotifyUri: '',
              youtubeId: item.id?.videoId || 'dQw4w9WgXcQ'
            };
          });
          return res.json({ results: mapped, source: 'youtube_live_api' });
        }
      }
    } catch (err) {
      console.warn('Live YouTube Search Api failed, jumping to fallback:', err);
    }
  }

  // --- CASE C: POWERFUL CENTRALIZED METADATA FALLBACK (iTunes API engine) ---
  // If keys are not configured yet, we query the iTunes Search API to retrieve accurate artist & song info
  // and construct realistic URLs & playback IDs based on actual release database matches.
  try {
    const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`;
    const response = await fetch(iTunesUrl);
    const data = await response.json() as any;
    
    if (data && data.results) {
      const results = data.results.map((item: any) => {
        const durationMs = item.trackTimeMillis || 210000;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Formulate deterministic simulated IDs/hashes to feed embeds safely
        const trackIdNumeric = String(item.trackId || Math.floor(Math.random() * 100000000));
        
        return {
          id: provider === 'youtube' ? `yt-${trackIdNumeric}` : `sp-${trackIdNumeric}`,
          title: item.trackName || 'Musik Kafe Pilihan',
          artist: item.artistName || 'Penyanyi Berbakat',
          duration: durationStr,
          artworkUrl: item.artworkUrl100 || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&fit=crop',
          spotifyUri: `spotify:track:${trackIdNumeric}`,
          // If seeking YouTube without credentials, we use search/query strings mapped as video fallback or standard playlist search URI
          youtubeId: trackIdNumeric
        };
      });
      return res.json({ results, source: `${provider}_fallback_itunes` });
    }
  } catch (err: any) {
    console.error('Fallback Search Master failed:', err);
  }

  // Final manual static matching fallback to make sure empty queries or failed network requests never crash
  res.json({
    results: [
      {
        id: 'fallback-1',
        title: 'Kopi Dangdut',
        artist: 'Fahmy Shahab',
        duration: '3:45',
        artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&fit=crop',
        spotifyUri: 'spotify:track:4PTG3Z6ehGkBF36qHkY7S9',
        youtubeId: 'M-v_NfptjBw'
      },
      {
        id: 'fallback-2',
        title: 'Gajah',
        artist: 'Tulus',
        duration: '4:12',
        artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&fit=crop',
        spotifyUri: 'spotify:track:1GndpMyEymJIDG25FAtgV7',
        youtubeId: '3n3PpAIrO0mGbJEciNccg9'
      }
    ],
    source: 'static_emergency_fallback'
  });
});

// 4. Jukebox Data Flow and Integration Outline Document Endpoint
app.get("/api/jukebox/schema", (req, res) => {
  res.json({
    title: "Sistem Jukebox Digital ScanBite (Spotify & YouTube API Integration Blueprint)",
    apiEndpoints: {
      search: "GET /api/jukebox/search?q={query}&provider={spotify|youtube}",
      config: "GET /api/jukebox/config",
      schema: "GET /api/jukebox/schema"
    },
    dataFlow: {
      step1_order_completed: "Customer completes payment successfully in Checkout.tsx. This flags order details and unlocks jukebox requests.",
      step2_song_search: "User inputs song name. Client triggers debounced GET request to /api/jukebox/search.",
      step3_backend_proc: "Backend inspects environment variables. If credentials exist, queries real Spotify or YouTube. Else queries iTunes metadata and enriches responses.",
      step4_request_submit: "Customer selects song. Track metadata (including artwork, Spotify URI, YouTube ID) is appended to Supabase table 'sb_song_requests' (or localStorage fallback). Runs sync cascades.",
      step5_admin_broadcast: "Admin page listens to sb_song_requests changes in real-time. Playlist queue is displayed sorted by total customer 'Upvote' tallies.",
      step6_player_stream: "Cashier plays music direct on the cafe sound system. Plays seamlessly using embedded Youtube Iframes or Spotify Web Embed Players built inside the admin panel."
    },
    databaseSchema: {
      table: "sb_song_requests",
      columns: {
        id: "uuid PRIMARY KEY DEFAULT uuid_generate_v4()",
        tenant_id: "varchar (Separation of stores)",
        title: "varchar (Song title)",
        artist: "varchar (Artist name)",
        duration: "varchar (e.g. '4:12')",
        table_number: "varchar (Which customer requested it)",
        votes: "integer DEFAULT 1 (Total user upvotes)",
        is_playing: "boolean DEFAULT false (Current live song state)",
        artwork_url: "text (Album art thumbnail URL)",
        youtube_id: "varchar (YouTube video hash)",
        spotify_uri: "varchar (Spotify track identifier)",
        created_at: "timestamp with time zone DEFAULT now()"
      }
    }
  });
});

// 5. Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", timestamp: new Date() });
});

// Setup Vite Dev Middleware vs Static Server for production
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Menjalankan server di mode DEVELOPMENT dengan Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Menjalankan server di mode PRODUCTION...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ScanBite Server berjalan di http://localhost:${PORT}`);
  });
}

configureServer();
