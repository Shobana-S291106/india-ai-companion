import { useEffect, useRef, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  // =========================================================
  // BASIC CHAT
  // =========================================================

  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loadingFeature, setLoadingFeature] = useState("");

  // =========================================================
  // TALK TO LOCALS
  // =========================================================

  const [talkPanelOpen, setTalkPanelOpen] = useState(false);
  const [talking, setTalking] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translatingVoice, setTranslatingVoice] = useState(false);

  // =========================================================
  // VISION AI
  // =========================================================

  const [selectedImage, setSelectedImage] = useState(null);
  const [menuResult, setMenuResult] = useState("");
  const [analyzingMenu, setAnalyzingMenu] = useState(false);
  const [visionMode, setVisionMode] = useState("menu");

  // =========================================================
  // CAMERA
  // =========================================================

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraFacing, setCameraFacing] = useState("environment");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // =========================================================
  // FEATURE PANEL
  // =========================================================

  const [activeFeature, setActiveFeature] = useState("");

  // =========================================================
  // SAFETY
  // =========================================================

  const [safetySituation, setSafetySituation] = useState("");
  const [safetyResult, setSafetyResult] = useState("");

  // =========================================================
  // CULTURE
  // =========================================================

  const [cultureQuestion, setCultureQuestion] = useState("");
  const [cultureResult, setCultureResult] = useState("");

  // =========================================================
  // MEMORY
  // =========================================================

  const emptyProfile = {
    food: "",
    spice: "",
    budget: "",
    interests: "",
    currentPlace: "",
    travelStyle: ""
  };

  const [travellerProfile, setTravellerProfile] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("indiaCompanionProfile")
        ) || emptyProfile
      );
    } catch {
      return emptyProfile;
    }
  });

  // =========================================================
  // PLAN
  // =========================================================

  const [planResult, setPlanResult] = useState("");

  // =========================================================
  // BILL
  // =========================================================

  const [billQuestion, setBillQuestion] = useState("");
  const [billResult, setBillResult] = useState("");

  // =========================================================
  // TRANSPORT
  // =========================================================

  const [transportQuestion, setTransportQuestion] =
    useState("");

  const [transportResult, setTransportResult] =
    useState("");

  // =========================================================
  // LOCATION
  // =========================================================

  const [locationText, setLocationText] = useState("");
  const [locationResult, setLocationResult] = useState("");

  // NEW: AUTOMATIC LOCATION STATE
  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [locationStatus, setLocationStatus] =
    useState("detecting");

  // =========================================================
  // EMERGENCY
  // =========================================================

  const [emergencyResult, setEmergencyResult] = useState("");

  // =========================================================
  // COMPANION MODE
  // =========================================================

  const [companionMode, setCompanionMode] =
    useState(false);

  // =========================================================
  // FEATURE TOGGLE
  // =========================================================

  const toggleFeature = (feature) => {
    setActiveFeature((current) =>
      current === feature ? "" : feature
    );
  };


  const [locationCoords, setLocationCoords] = useState(null);

  const [locationInfo, setLocationInfo] = useState({
    status: "Detecting your location...",
    city: "",
    locality: "",
    state: "",
    country: "",
    displayName: ""
  });

  const [locationLoading, setLocationLoading] = useState(false);
  // =========================================================
  // AUTOMATIC LOCATION
  // =========================================================

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("detecting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        const location = {
          latitude,
          longitude,
          accuracy
        };

        setCurrentLocation(location);
        setLocationStatus("available");

        setLocationText(
          `Latitude: ${latitude.toFixed(
            5
          )}, Longitude: ${longitude.toFixed(5)}`
        );

        /*
         * Store coordinates locally so the current
         * session can use them without repeatedly
         * asking the browser for permission.
         */
        localStorage.setItem(
          "indiaCompanionLocation",
          JSON.stringify(location)
        );
      },
      (error) => {
        console.warn(
          "AUTOMATIC LOCATION ERROR:",
          error
        );

        setLocationStatus("denied");

        if (error.code === 1) {
          setLocationResult(
            "Location permission was denied. You can enable it in your browser settings."
          );
        } else if (error.code === 2) {
          setLocationResult(
            "Your current location could not be determined."
          );
        } else if (error.code === 3) {
          setLocationResult(
            "Location detection timed out. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // =========================================================
  // AUTOMATIC LOCATION ON APP START
  // =========================================================

  useEffect(() => {
    /*
     * First try previously stored location.
     */
    try {
      const savedLocation =
        JSON.parse(
          localStorage.getItem(
            "indiaCompanionLocation"
          )
        );

      if (
        savedLocation &&
        savedLocation.latitude &&
        savedLocation.longitude
      ) {
        setCurrentLocation(savedLocation);

        setLocationStatus("available");

        setLocationText(
          `Latitude: ${savedLocation.latitude.toFixed(
            5
          )}, Longitude: ${savedLocation.longitude.toFixed(
            5
          )}`
        );
      }
    } catch {
      // Ignore invalid stored location.
    }

    /*
     * Request a fresh location.
     */
    detectCurrentLocation();
  }, []);

  // =========================================================
  // PROFILE CONTEXT
  // =========================================================

  const getProfileContext = () => {
    let locationContext =
      travellerProfile.currentPlace ||
      "Not specified";

    if (currentLocation) {
      locationContext += `
GPS latitude: ${currentLocation.latitude}
GPS longitude: ${currentLocation.longitude}
Approximate accuracy: ${Math.round(
        currentLocation.accuracy
      )} meters`;
    }

    return `
Traveller profile:
Food preference: ${
      travellerProfile.food || "Not specified"
    }
Spice preference: ${
      travellerProfile.spice || "Not specified"
    }
Budget: ${
      travellerProfile.budget || "Not specified"
    }
Interests: ${
      travellerProfile.interests || "Not specified"
    }
Current place: ${locationContext}
Travel style: ${
      travellerProfile.travelStyle || "Not specified"
    }
`;
  };

  // =========================================================
  // AI FEATURE REQUEST
  // =========================================================

  const askFeature = async (
    featureName,
    prompt,
    setter
  ) => {
    setLoadingFeature(featureName);

    try {
      const result = await fetch(
        `${API}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message:
              `${prompt}\n\n${getProfileContext()}`,
            menu_context: menuResult
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(
          data.detail ||
            "AI request failed."
        );
      }

      setter(data.response);
    } catch (error) {
      console.error(
        `${featureName} ERROR:`,
        error
      );

      setter(
        "Sorry, I couldn't connect to the AI companion right now. Please try again."
      );
    } finally {
      setLoadingFeature("");
    }
  };

  // =========================================================
  // NORMAL CHAT
  // =========================================================

  const askCompanion = async () => {
    if (!message.trim()) {
      return;
    }

    const currentMessage = message;

    setMessage("");
    setResponse("Thinking...");

    try {
      const result = await fetch(
        `${API}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message:
              `${currentMessage}\n\n${getProfileContext()}`,
            menu_context: menuResult
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(
          data.detail ||
            "Something went wrong."
        );
      }

      setResponse(data.response);
    } catch (error) {
      console.error(
        "CHAT ERROR:",
        error
      );

      setResponse(
        "Sorry, I couldn't connect to your AI companion right now."
      );
    }
  };

  // =========================================================
  // TALK TO LOCALS
  // =========================================================

  const translateSpokenText = async (text) => {
    if (!text.trim()) {
      return;
    }

    setTranslatingVoice(true);
    setTranslatedText("");

    try {
      const result = await fetch(
        `${API}/translate-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            source_language: "English",
            target_language: "Tamil"
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(
          data.detail ||
            "Translation failed."
        );
      }

      setTranslatedText(data.translated);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const speech =
          new SpeechSynthesisUtterance(
            data.translated
          );

        speech.lang = "ta-IN";
        speech.rate = 0.9;
        speech.pitch = 1;

        window.speechSynthesis.speak(
          speech
        );
      }
    } catch (error) {
      console.error(
        "TRANSLATION ERROR:",
        error
      );

      setTranslatedText(
        "Sorry, I couldn't translate that."
      );
    } finally {
      setTranslatingVoice(false);
    }
  };

  const startTalkToLocals = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported. Please use Google Chrome."
      );
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setTalking(true);
      setSpokenText("");
      setTranslatedText("");
    };

    recognition.onresult = async (event) => {
      const text =
        event.results[0][0].transcript;

      setSpokenText(text);
      setTalking(false);

      await translateSpokenText(text);
    };

    recognition.onerror = (event) => {
      console.error(
        "VOICE ERROR:",
        event.error
      );

      setTalking(false);

      if (
        event.error === "not-allowed"
      ) {
        setSpokenText(
          "Microphone permission was blocked. Please allow microphone access."
        );
      } else if (
        event.error === "no-speech"
      ) {
        setSpokenText(
          "I didn't hear anything. Please try again."
        );
      } else {
        setSpokenText(
          "Sorry, I couldn't hear you. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setTalking(false);
    };

    recognition.start();
  };

  const playTamilAgain = () => {
    if (!translatedText) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert(
        "Text-to-speech is not supported."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        translatedText
      );

    speech.lang = "ta-IN";
    speech.rate = 0.9;

    window.speechSynthesis.speak(speech);
  };

  // =========================================================
  // CAMERA
  // =========================================================

  const openCamera = async (
    mode = "menu"
  ) => {
    try {
      setCameraError("");
      setVisionMode(mode);

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Camera access is not supported by this browser."
        );
        return;
      }

      let stream;

      try {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                exact: "environment"
              }
            },
            audio: false
          });
      } catch {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
      }

      streamRef.current = stream;

      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch(() => {});
        }
      }, 200);
    } catch (error) {
      console.error(
        "CAMERA ERROR:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (
        error.name === "NotFoundError"
      ) {
        setCameraError(
          "No camera was found."
        );
      } else {
        setCameraError(
          "Unable to open the camera."
        );
      }
    }
  };

  const switchCamera = async () => {
    try {
      setCameraError("");

      const newFacing =
        cameraFacing === "environment"
          ? "user"
          : "environment";

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: newFacing
            }
          },
          audio: false
        });

      streamRef.current = stream;

      setCameraFacing(newFacing);

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current
          .play()
          .catch(() => {});
      }
    } catch (error) {
      console.error(
        "SWITCH CAMERA ERROR:",
        error
      );

      setCameraError(
        "Unable to switch camera on this device."
      );
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      alert(
        "Camera is still starting. Please wait."
      );
      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const file = new File(
          [blob],
          "india-companion-photo.jpg",
          {
            type: "image/jpeg"
          }
        );

        setSelectedImage(file);
        setMenuResult("");

        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  // =========================================================
  // IMAGE
  // =========================================================

  const handleImageSelect = (event) => {
    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setMenuResult("");
    setCameraError("");
  };

  const removeImage = () => {
    setSelectedImage(null);
    setMenuResult("");
  };

  // =========================================================
  // VISION AI
  // =========================================================

  const analyzeMenu = async () => {
    if (!selectedImage) {
      return;
    }

    setAnalyzingMenu(true);
    setMenuResult("");

    const formData =
      new FormData();

    formData.append(
      "file",
      selectedImage
    );

    try {
      const result =
        await fetch(
          `${API}/analyze-menu`,
          {
            method: "POST",
            body: formData
          }
        );

      const data =
        await result.json();

      if (!result.ok) {
        throw new Error(
          data.detail ||
            "Vision analysis failed."
        );
      }

      setMenuResult(
        data.response
      );
    } catch (error) {
      console.error(
        "VISION ERROR:",
        error
      );

      setMenuResult(
        "Sorry, I couldn't understand this image. Please try a clearer photo."
      );
    } finally {
      setAnalyzingMenu(false);
    }
  };

  // =========================================================
  // SAFETY
  // =========================================================

  const checkSafety = async () => {
    if (!safetySituation.trim()) {
      return;
    }

    await askFeature(
      "safety",
      `
You are the Safety Intelligence module of India Companion.

Analyze this travel situation:

"${safetySituation}"

Return:

1. Safety level: LOW / MEDIUM / HIGH
2. Possible warning signs
3. What the traveller should do
4. What the traveller should avoid
5. One calm practical recommendation

Do not accuse anyone without evidence.
Do not create unnecessary fear.
Focus on practical safety.
`,
      setSafetyResult
    );
  };

  // =========================================================
  // CULTURE
  // =========================================================

  const explainCulture = async () => {
    if (!cultureQuestion.trim()) {
      return;
    }

    await askFeature(
      "culture",
      `
You are the Culture Interpreter of India Companion.

Explain this situation to a foreign traveller:

"${cultureQuestion}"

Explain:

- What is happening
- Why people may do it
- How the traveller should behave respectfully
- Whether it can differ across Indian regions

Avoid stereotypes.
Do not claim every Indian follows the same custom.
`,
      setCultureResult
    );
  };

  // =========================================================
  // MEMORY
  // =========================================================

  const saveTravellerProfile = () => {
    localStorage.setItem(
      "indiaCompanionProfile",
      JSON.stringify(
        travellerProfile
      )
    );

    setActiveFeature("");

    setResponse(
      "🧠 Your travel preferences are saved. India Companion can now use them to personalize suggestions."
    );
  };

  // =========================================================
  // PLAN
  // =========================================================

  const getPlan = async () => {
    await askFeature(
      "planning",
      `
You are the intelligent travel planning module.

Based on the traveller profile, suggest what they could do now in India.

Consider:

- Current location
- Time of day
- Budget
- Interests
- Food preferences
- Travel style

Give:

1. Best recommendation
2. Two alternatives
3. Approximate time
4. Budget guidance
5. One practical travel tip

Do not invent exact opening hours.
`,
      setPlanResult
    );
  };

  // =========================================================
  // BILL
  // =========================================================

  const explainBill = async () => {
    if (!billQuestion.trim()) {
      return;
    }

    await askFeature(
      "bill",
      `
You are the Bill and Price Intelligence module.

The traveller says:

"${billQuestion}"

Help them understand:

- Items
- Quantities
- Prices
- Taxes
- Additional charges
- Total
- Anything unusual that deserves clarification

Never accuse a business of fraud without evidence.
`,
      setBillResult
    );
  };

  // =========================================================
  // TRANSPORT
  // =========================================================

  const decodeTransport = async () => {
    if (!transportQuestion.trim()) {
      return;
    }

    await askFeature(
      "transport",
      `
You are the India Transport Decoder.

The traveller has this information:

"${transportQuestion}"

Explain it simply.

Identify where possible:

- Train/bus number
- Departure
- Arrival
- Platform
- Coach
- Seat
- Ticket type
- Important instructions

Clearly mark unknown information.
`,
      setTransportResult
    );
  };

  // =========================================================
  // LOCATION
  // =========================================================

  const explainLocation = () => {
    setActiveFeature("location");
    setLocationResult(
      "Finding your location..."
    );

    if (!navigator.geolocation) {
      setLocationResult(
        "Location is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        const location = {
          latitude,
          longitude,
          accuracy
        };

        setCurrentLocation(location);
        setLocationStatus("available");

        localStorage.setItem(
          "indiaCompanionLocation",
          JSON.stringify(location)
        );

        setLocationText(
          `Latitude: ${latitude.toFixed(
            5
          )}, Longitude: ${longitude.toFixed(
            5
          )}`
        );

        await askFeature(
          "location",
          `
The traveller's current GPS coordinates are:

Latitude: ${latitude}
Longitude: ${longitude}
Accuracy: approximately ${Math.round(
            accuracy
          )} meters

Explain what travel context they should consider.

Do not invent an exact address.

If the exact place cannot be determined,
say so.

Give practical guidance.
`,
          setLocationResult
        );
      },
      () => {
        setLocationResult(
          "Unable to access your location. Please allow location permission."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // =========================================================
  // COMPANION MODE
  // =========================================================

  const activateCompanionMode =
    async () => {
      setCompanionMode(true);

      await askFeature(
        "companion",
        `
You are India Companion in FULL COMPANION MODE.

Create a concise travel situation summary.

Return:

🧠 TRAVEL CONTEXT
- Traveller preferences

📍 CURRENT FOCUS
- What the traveller appears to need

✨ SUGGESTION
- One useful next action

⚠️ REMEMBER
- One important safety or cultural tip

Make it feel like a personal companion,
not a generic travel guide.
`,
        setResponse
      );
    };

  // =========================================================
  // EMERGENCY
  // =========================================================

  const activateEmergency = async (
    type
  ) => {
    const prompts = {
      medical:
        "The traveller may have a medical emergency. Give immediate safe steps and advise contacting local emergency medical services.",

      police:
        "The traveller needs police assistance. Give calm practical safety steps and advise contacting local emergency services.",

      lost:
        "The traveller is lost. Give immediate steps to stay safe, identify their location, and find trusted assistance.",

      fire:
        "The traveller may be experiencing a fire emergency. Give immediate evacuation and safety instructions.",

      contact:
        "The traveller needs to contact someone they trust. Help them prepare a short emergency message."
    };

    await askFeature(
      "emergency",
      `
EMERGENCY MODE.

Situation:
${prompts[type]}

Keep the response short and action-oriented.

Do not provide dangerous medical instructions.
Do not delay emergency services.

Current location information:
${
      currentLocation
        ? `Latitude: ${currentLocation.latitude}
Longitude: ${currentLocation.longitude}`
        : "Location unavailable"
    }
`,
      setEmergencyResult
    );
  };

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =========================================================
  // FEATURE CARD
  // =========================================================

  const FeatureCard = ({
    id,
    icon,
    title,
    subtitle,
    className = ""
  }) => (
    <button
      className={`feature-card ${className} ${
        activeFeature === id
          ? "active"
          : ""
      }`}
      onClick={() =>
        toggleFeature(id)
      }
    >
      <div className="feature-card-icon">
        {icon}
      </div>

      <div className="feature-card-content">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className="feature-card-arrow">
        {activeFeature === id
          ? "⌃"
          : "›"}
      </div>
    </button>
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="brand">

          <div className="brand-icon">
            🇮🇳
          </div>

          <div>
            <div className="brand-name">
              India Companion
            </div>

            <div className="brand-subtitle">
              Your intelligent travel companion
            </div>
          </div>

        </div>

        <div className="status-pill">

          <span className="status-dot"></span>

          AI Companion Active

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="hero-section">

          <div className="hero-content">

            <div className="hero-eyebrow">
              YOUR PERSONAL TRAVEL COMPANION
            </div>

            <h1>
              Explore India.
              <br />
              <span>
                Understand India.
              </span>
            </h1>

            <p className="hero-description">
              An AI-powered companion designed
              to help foreign travellers understand,
              adapt to and confidently experience
              India independently.
            </p>

            <div className="hero-feature-row">

              <div className="hero-feature">
                <span>🤖</span>

                <div>
                  <strong>
                    AI Companion
                  </strong>

                  <small>
                    Personalized conversations
                  </small>
                </div>
              </div>

              <div className="hero-feature">
                <span>📷</span>

                <div>
                  <strong>
                    Vision AI
                  </strong>

                  <small>
                    Understand your surroundings
                  </small>
                </div>
              </div>

              <div className="hero-feature">
                <span>🛡️</span>

                <div>
                  <strong>
                    Safety Intelligence
                  </strong>

                  <small>
                    Make safer decisions
                  </small>
                </div>
              </div>

              <div className="hero-feature">
                <span>🪷</span>

                <div>
                  <strong>
                    Culture Guide
                  </strong>

                  <small>
                    Understand local customs
                  </small>
                </div>
              </div>

            </div>

          </div>

          {/* =================================================
              CHAT
          ================================================= */}

          <div className="chat-card">

            <div className="chat-top">

              <div className="assistant-avatar">
                🤖
              </div>

              <div>
                <div className="assistant-name">
                  India Companion
                </div>

                <div className="assistant-status">
                  <span></span>
                  Always here to help
                </div>
              </div>

            </div>

            <div className="chat-body">

              <div className="welcome-message">

                <div className="welcome-title">
                  Namaste! 👋
                </div>

                <p>
                  Welcome to India. I'm your
                  personal travel companion.
                </p>

                <p>
                  Ask me anything about your
                  journey, culture, food or safety.
                </p>

              </div>

              {/* AUTOMATIC LOCATION STATUS */}

              <div className="automatic-context-bar">

                <div className="automatic-context-icon">
                  📍
                </div>

                <div className="automatic-context-content">

                  <strong>
                    {locationStatus ===
                    "available"
                      ? "Location detected"
                      : locationStatus ===
                        "detecting"
                      ? "Detecting your location..."
                      : "Location unavailable"}
                  </strong>

                  <span>
                    {locationStatus ===
                    "available"
                      ? "Your companion can use your current location."
                      : locationStatus ===
                        "detecting"
                      ? "Allow location access to make your companion more aware."
                      : "You can enable location permission anytime."}
                  </span>

                </div>

                {locationStatus !==
                  "available" && (
                  <button
                    onClick={
                      detectCurrentLocation
                    }
                  >
                    📍 Detect
                  </button>
                )}

              </div>

              {response && (
                <div className="chat-response">

                  <div className="response-label">
                    🤖 India Companion
                  </div>

                  <div className="response-text">

                    <FormattedResponse
                      text={response}
                    />

                  </div>

                </div>
              )}

              {/* =============================================
                  COMPANION MODE
              ============================================= */}

              <div className="companion-banner">

                <div className="companion-banner-icon">
                  🧠
                </div>

                <div className="companion-banner-content">

                  <strong>
                    Companion Mode
                  </strong>

                  <span>
                    Let your AI companion understand your journey
                  </span>

                </div>

                <button
                  onClick={
                    activateCompanionMode
                  }
                  disabled={
                    loadingFeature ===
                    "companion"
                  }
                >
                  {loadingFeature ===
                  "companion"
                    ? "..."
                    : companionMode
                    ? "Active"
                    : "Activate"}
                </button>

              </div>

              {/* =============================================
                  TALK TO LOCALS
              ============================================= */}

              <div className="talk-section">

                <button
                  className="talk-header-button"
                  onClick={() =>
                    setTalkPanelOpen(
                      !talkPanelOpen
                    )
                  }
                >

                  <div className="talk-header-left">

                    <div className="talk-icon">
                      🗣️
                    </div>

                    <div>
                      <strong>
                        Talk to Locals
                      </strong>

                      <span>
                        English → Tamil
                      </span>
                    </div>

                  </div>

                  <div className="talk-arrow">
                    {talkPanelOpen
                      ? "⌃"
                      : "›"}
                  </div>

                </button>

                {talkPanelOpen && (
                  <div className="talk-content">

                    <div className="talk-intro">
                      Speak naturally in English
                      and let your companion
                      translate it into Tamil.
                    </div>

                    {!spokenText &&
                      !translatingVoice && (
                        <div className="talk-start">

                          <button
                            className="big-mic"
                            onClick={
                              startTalkToLocals
                            }
                          >
                            {talking
                              ? "🔴"
                              : "🎤"}
                          </button>

                          <strong>
                            {talking
                              ? "Listening..."
                              : "Tap to Speak"}
                          </strong>

                          <span>
                            Your words will be
                            translated naturally.
                          </span>

                        </div>
                      )}

                    {translatingVoice && (
                      <div className="talk-loading">

                        <div className="spinner"></div>

                        <strong>
                          Translating...
                        </strong>

                        <span>
                          Preparing natural Tamil
                        </span>

                      </div>
                    )}

                    {spokenText &&
                      translatedText &&
                      !translatingVoice && (
                        <div className="translation-area">

                          <div className="speech-box">

                            <span>
                              🇬🇧 YOU
                            </span>

                            <p>
                              "{spokenText}"
                            </p>

                          </div>

                          <div className="translation-arrow-big">
                            ↓
                          </div>

                          <div className="speech-box tamil">

                            <span>
                              🇮🇳 SAY THIS
                            </span>

                            <p>
                              {translatedText}
                            </p>

                          </div>

                          <div className="translation-actions">

                            <button
                              onClick={
                                playTamilAgain
                              }
                            >
                              🔊 Play
                            </button>

                            <button
                              onClick={
                                startTalkToLocals
                              }
                            >
                              🎤 Speak Again
                            </button>

                          </div>

                        </div>
                      )}

                  </div>
                )}

              </div>

              {/* =============================================
                  FEATURES TITLE
              ============================================= */}

              <div className="section-heading">

                <div>
                  <h2>
                    Companion Tools
                  </h2>

                  <p>
                    Intelligent help for every part
                    of your journey
                  </p>
                </div>

                <span>
                  {activeFeature
                    ? "1 active"
                    : "8 tools"}
                </span>

              </div>

              {/* =============================================
                  FEATURE GRID
              ============================================= */}

              <div className="feature-grid">

                <FeatureCard
                  id="safety"
                  icon="🛡️"
                  title="Safety Intelligence"
                  subtitle="Is this safe?"
                  className="safety-card"
                />

                <FeatureCard
                  id="culture"
                  icon="🪷"
                  title="Culture Interpreter"
                  subtitle="Why do people do this?"
                />

                <FeatureCard
                  id="planning"
                  icon="✨"
                  title="What Should I Do?"
                  subtitle="Get a personalized suggestion"
                />

                <FeatureCard
                  id="memory"
                  icon="🧠"
                  title="Travel Memory"
                  subtitle="Personalize my companion"
                />

                <FeatureCard
                  id="bill"
                  icon="💰"
                  title="Bill Intelligence"
                  subtitle="Understand prices & charges"
                />

                <FeatureCard
                  id="transport"
                  icon="🚆"
                  title="Transport Decoder"
                  subtitle="Understand tickets & journeys"
                />

                <FeatureCard
                  id="location"
                  icon="📍"
                  title="Explain Where I Am"
                  subtitle="Understand my surroundings"
                />

                <FeatureCard
                  id="emergency"
                  icon="🆘"
                  title="Emergency Mode"
                  subtitle="Get immediate help"
                  className="emergency-card"
                />

              </div>

              {/* =============================================
                  ACTIVE FEATURE PANEL
              ============================================= */}

              {activeFeature && (
                <div className="active-feature-panel">

                  {/* SAFETY */}

                  {activeFeature ===
                    "safety" && (
                    <div>

                      <FeaturePanelHeader
                        icon="🛡️"
                        title="Safety Intelligence"
                        subtitle="Describe what is happening"
                      />

                      <textarea
                        className="feature-input"
                        placeholder="Example: An auto driver is asking me for ₹800 for a short trip..."
                        value={
                          safetySituation
                        }
                        onChange={(e) =>
                          setSafetySituation(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="primary-button"
                        onClick={
                          checkSafety
                        }
                        disabled={
                          loadingFeature ===
                          "safety"
                        }
                      >
                        {loadingFeature ===
                        "safety"
                          ? "Analyzing..."
                          : "🛡️ Check Safety"}
                      </button>

                      {safetyResult && (
                        <ResultBox
                          text={
                            safetyResult
                          }
                        />
                      )}

                    </div>
                  )}

                  {/* CULTURE */}

                  {activeFeature ===
                    "culture" && (
                    <div>

                      <FeaturePanelHeader
                        icon="🪷"
                        title="Culture Interpreter"
                        subtitle="Understand unfamiliar customs"
                      />

                      <textarea
                        className="feature-input"
                        placeholder="Example: Why is everyone removing their footwear before entering?"
                        value={
                          cultureQuestion
                        }
                        onChange={(e) =>
                          setCultureQuestion(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="primary-button"
                        onClick={
                          explainCulture
                        }
                        disabled={
                          loadingFeature ===
                          "culture"
                        }
                      >
                        {loadingFeature ===
                        "culture"
                          ? "Explaining..."
                          : "🪷 Explain This"}
                      </button>

                      {cultureResult && (
                        <ResultBox
                          text={
                            cultureResult
                          }
                        />
                      )}

                    </div>
                  )}

                  {/* PLANNING */}

                  {activeFeature ===
                    "planning" && (
                    <div>

                      <FeaturePanelHeader
                        icon="✨"
                        title="What Should I Do Now?"
                        subtitle="Personalized travel intelligence"
                      />

                      <p className="panel-description">
                        Your companion will consider
                        your saved preferences and travel
                        context.
                      </p>

                      <button
                        className="primary-button"
                        onClick={getPlan}
                        disabled={
                          loadingFeature ===
                          "planning"
                        }
                      >
                        {loadingFeature ===
                        "planning"
                          ? "Planning..."
                          : "✨ Suggest My Next Activity"}
                      </button>

                      {planResult && (
                        <ResultBox
                          text={
                            planResult
                          }
                        />
                      )}

                    </div>
                  )}

                  {/* MEMORY */}

                  {activeFeature ===
                    "memory" && (
                    <div>

                      <FeaturePanelHeader
                        icon="🧠"
                        title="Travel Memory"
                        subtitle="Personalize your companion"
                      />

                      <div className="profile-grid">

                        <input
                          placeholder="Food preference"
                          value={
                            travellerProfile.food
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                food: e.target.value
                              }
                            )
                          }
                        />

                        <input
                          placeholder="Spice preference"
                          value={
                            travellerProfile.spice
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                spice: e.target.value
                              }
                            )
                          }
                        />

                        <input
                          placeholder="Budget"
                          value={
                            travellerProfile.budget
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                budget: e.target.value
                              }
                            )
                          }
                        />

                        <input
                          placeholder="Interests"
                          value={
                            travellerProfile.interests
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                interests:
                                  e.target.value
                              }
                            )
                          }
                        />

                        <input
                          placeholder="Current place"
                          value={
                            travellerProfile.currentPlace
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                currentPlace:
                                  e.target.value
                              }
                            )
                          }
                        />

                        <input
                          placeholder="Travel style"
                          value={
                            travellerProfile.travelStyle
                          }
                          onChange={(e) =>
                            setTravellerProfile(
                              {
                                ...travellerProfile,
                                travelStyle:
                                  e.target.value
                              }
                            )
                          }
                        />

                      </div>

                      <button
                        className="primary-button"
                        onClick={
                          saveTravellerProfile
                        }
                      >
                        💾 Save My Preferences
                      </button>

                    </div>
                  )}

                  {/* BILL */}

                  {activeFeature ===
                    "bill" && (
                    <div>

                      <FeaturePanelHeader
                        icon="💰"
                        title="Bill Intelligence"
                        subtitle="Understand prices and charges"
                      />

                      <textarea
                        className="feature-input"
                        placeholder="Example: Dosa ₹80, Coffee ₹40, Tax ₹12..."
                        value={
                          billQuestion
                        }
                        onChange={(e) =>
                          setBillQuestion(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="primary-button"
                        onClick={
                          explainBill
                        }
                        disabled={
                          loadingFeature ===
                          "bill"
                        }
                      >
                        {loadingFeature ===
                        "bill"
                          ? "Checking..."
                          : "💰 Understand Bill"}
                      </button>

                      {billResult && (
                        <ResultBox
                          text={
                            billResult
                          }
                        />
                      )}

                    </div>
                  )}

                  {/* TRANSPORT */}

                  {activeFeature ===
                    "transport" && (
                    <div>

                      <FeaturePanelHeader
                        icon="🚆"
                        title="Transport Decoder"
                        subtitle="Understand tickets and journeys"
                      />

                      <textarea
                        className="feature-input"
                        placeholder="Example: Train 12637, Chennai to Madurai, 9:40 PM, Platform 4, Coach B2, Seat 36"
                        value={
                          transportQuestion
                        }
                        onChange={(e) =>
                          setTransportQuestion(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="primary-button"
                        onClick={
                          decodeTransport
                        }
                        disabled={
                          loadingFeature ===
                          "transport"
                        }
                      >
                        {loadingFeature ===
                        "transport"
                          ? "Decoding..."
                          : "🚆 Decode Journey"}
                      </button>

                      {transportResult && (
                        <ResultBox
                          text={
                            transportResult
                          }
                        />
                      )}

                    </div>
                  )}

                  {/* LOCATION */}

                  {activeFeature ===
                    "location" && (
                    <div>

                      <FeaturePanelHeader
                        icon="📍"
                        title="Where Am I?"
                        subtitle="Understand your surroundings"
                      />

                      <div className="location-status-row">

                        <span>
                          {locationStatus ===
                          "available"
                            ? "🟢 Location available"
                            : locationStatus ===
                              "detecting"
                            ? "🟡 Detecting..."
                            : "🔴 Location unavailable"}
                        </span>

                        <button
                          onClick={
                            detectCurrentLocation
                          }
                        >
                          🔄 Refresh
                        </button>

                      </div>

                      {locationText && (
                        <div className="location-box">
                          📍 {locationText}
                        </div>
                      )}

                      <div className="result-box">

                        {loadingFeature ===
                          "location" && (
                          <div className="small-loader">

                            <div className="spinner"></div>

                            Understanding location...

                          </div>
                        )}

                        {locationResult &&
                          loadingFeature !==
                            "location" && (
                          <FormattedResponse
                            text={
                              locationResult
                            }
                          />
                        )}

                      </div>

                    </div>
                  )}

                  {/* EMERGENCY */}

                  {activeFeature ===
                    "emergency" && (
                    <div>

                      <FeaturePanelHeader
                        icon="🆘"
                        title="Emergency Mode"
                        subtitle="Stay calm. Choose what you need."
                      />

                      <div className="emergency-grid">

                        <button
                          onClick={() =>
                            activateEmergency(
                              "medical"
                            )
                          }
                        >
                          <span>
                            🚑
                          </span>
                          Medical
                        </button>

                        <button
                          onClick={() =>
                            activateEmergency(
                              "police"
                            )
                          }
                        >
                          <span>
                            👮
                          </span>
                          Police
                        </button>

                        <button
                          onClick={() =>
                            activateEmergency(
                              "lost"
                            )
                          }
                        >
                          <span>
                            📍
                          </span>
                          I'm Lost
                        </button>

                        <button
                          onClick={() =>
                            activateEmergency(
                              "fire"
                            )
                          }
                        >
                          <span>
                            🔥
                          </span>
                          Fire
                        </button>

                        <button
                          onClick={() =>
                            activateEmergency(
                              "contact"
                            )
                          }
                        >
                          <span>
                            📞
                          </span>
                          Contact Someone
                        </button>

                      </div>

                      {loadingFeature ===
                        "emergency" && (
                        <div className="result-box">
                          Preparing emergency guidance...
                        </div>
                      )}

                      {emergencyResult && (
                        <ResultBox
                          text={
                            emergencyResult
                          }
                        />
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* =============================================
                  VISION AI
              ============================================= */}

              <div className="vision-section">

                <div className="section-heading vision-heading">

                  <div>
                    <h2>
                      Vision AI
                    </h2>

                    <p>
                      Let your companion understand
                      the world around you
                    </p>
                  </div>

                  <span>
                    📷 Multimodal
                  </span>

                </div>

                <div className="vision-actions">

                  <button
                    className="vision-button"
                    onClick={() =>
                      openCamera(
                        "menu"
                      )
                    }
                  >
                    <span>
                      📷
                    </span>

                    <div>
                      <strong>
                        Scan Menu
                      </strong>

                      <small>
                        Food, ingredients & prices
                      </small>
                    </div>
                  </button>

                  <button
                    className="vision-button"
                    onClick={() =>
                      openCamera(
                        "general"
                      )
                    }
                  >
                    <span>
                      👁️
                    </span>

                    <div>
                      <strong>
                        Understand This
                      </strong>

                      <small>
                        Signs, objects & situations
                      </small>
                    </div>
                  </button>

                  <input
                    type="file"
                    id="menuUpload"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                      handleImageSelect
                    }
                    hidden
                  />

                  <label
                    htmlFor="menuUpload"
                    className="vision-button upload-button"
                  >
                    <span>
                      🖼️
                    </span>

                    <div>
                      <strong>
                        Choose Photo
                      </strong>

                      <small>
                        Upload an image
                      </small>
                    </div>
                  </label>

                </div>

                <div className="vision-hint">
                  Scan menus, signs, bills,
                  tickets and unfamiliar things.
                </div>

              </div>

              {/* =============================================
                  CAMERA ERROR
              ============================================= */}

              {cameraError && (
                <div className="camera-error">
                  ⚠️ {cameraError}
                </div>
              )}

              {/* =============================================
                  CAMERA
              ============================================= */}

              {cameraOpen && (
                <div className="camera-panel">

                  <div className="camera-panel-header">

                    <div>
                      <strong>
                        {visionMode ===
                        "menu"
                          ? "📷 Scan Menu"
                          : "👁️ Understand This"}
                      </strong>

                      <span>
                        Position the object
                        clearly inside the frame
                      </span>
                    </div>

                    <button
                      onClick={
                        closeCamera
                      }
                    >
                      ✕
                    </button>

                  </div>

                  <div className="camera-view">

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                    />

                    <div className="camera-overlay">

                      <div className="camera-corner tl"></div>
                      <div className="camera-corner tr"></div>
                      <div className="camera-corner bl"></div>
                      <div className="camera-corner br"></div>

                    </div>

                  </div>

                  <div className="camera-controls">

                    <button
                      onClick={
                        switchCamera
                      }
                    >
                      🔄 Switch
                    </button>

                    <button
                      className="capture"
                      onClick={
                        capturePhoto
                      }
                    >
                      📸 Capture
                    </button>

                    <button
                      onClick={
                        closeCamera
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </div>
              )}

              {/* =============================================
                  IMAGE PREVIEW
              ============================================= */}

              {selectedImage &&
                !cameraOpen && (
                <div className="image-preview">

                  <div className="image-preview-top">

                    <div>
                      <strong>
                        📷 Image ready
                      </strong>

                      <span>
                        {selectedImage.name}
                      </span>
                    </div>

                    <button
                      onClick={
                        removeImage
                      }
                    >
                      ✕
                    </button>

                  </div>

                  <button
                    className="analyze-image-button"
                    onClick={
                      analyzeMenu
                    }
                    disabled={
                      analyzingMenu
                    }
                  >
                    {analyzingMenu
                      ? "🔍 Understanding..."
                      : "✨ Understand This Image"}
                  </button>

                </div>
              )}

              {/* =============================================
                  VISION RESULT
              ============================================= */}

              {analyzingMenu && (
                <div className="vision-processing">

                  <div className="spinner"></div>

                  <div>
                    <strong>
                      Understanding the image...
                    </strong>

                    <span>
                      India Companion is analyzing
                      what you captured.
                    </span>
                  </div>

                </div>
              )}

              {menuResult &&
                !analyzingMenu && (
                <div className="vision-result">

                  <div className="vision-result-header">

                    <div>
                      <strong>
                        👁️ Vision AI
                      </strong>

                      <span>
                        India Companion understood
                        the image
                      </span>
                    </div>

                    <span className="ai-badge">
                      ✦ AI
                    </span>

                  </div>

                  <div className="vision-result-content">

                    <FormattedResponse
                      text={menuResult}
                    />

                  </div>

                </div>
              )}

            </div>

            {/* ===============================================
                CHAT INPUT
            =============================================== */}

            <div className="chat-input-wrapper">

              <input
                type="text"
                placeholder="Ask your companion anything..."
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    askCompanion();
                  }
                }}
              />

              <button
                onClick={
                  askCompanion
                }
              >
                ➤
              </button>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <span>
          🇮🇳 India Companion
        </span>

        <span>
          AI-powered independent travel assistance
        </span>

      </footer>

    </div>
  );
}

// ============================================================
// FEATURE PANEL HEADER
// ============================================================

function FeaturePanelHeader({
  icon,
  title,
  subtitle
}) {
  return (
    <div className="panel-header">

      <div className="panel-icon">
        {icon}
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {subtitle}
        </span>
      </div>

    </div>
  );
}

// ============================================================
// MARKDOWN-STYLE RESPONSE RENDERER
// ============================================================

function FormattedResponse({ text }) {
  if (!text) {
    return null;
  }

  const lines =
    String(text).split("\n");

  const elements = [];
  let bulletItems = [];
  let numberedItems = [];

  const flushLists = () => {

    if (bulletItems.length > 0) {

      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="ai-list"
        >

          {bulletItems.map(
            (item, index) => (
              <li key={index}>
                <InlineMarkdown
                  text={item}
                />
              </li>
            )
          )}

        </ul>
      );

      bulletItems = [];
    }

    if (numberedItems.length > 0) {

      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="ai-list ai-numbered-list"
        >

          {numberedItems.map(
            (item, index) => (
              <li key={index}>
                <InlineMarkdown
                  text={item}
                />
              </li>
            )
          )}

        </ol>
      );

      numberedItems = [];
    }
  };

  lines.forEach(
    (rawLine, index) => {

      const line =
        rawLine.trim();

      if (!line) {
        flushLists();
        return;
      }

      if (
        line === "---" ||
        line === "***" ||
        line === "___"
      ) {

        flushLists();

        elements.push(
          <hr
            key={`hr-${index}`}
            className="ai-divider"
          />
        );

        return;
      }

      if (line.startsWith("# ")) {

        flushLists();

        elements.push(
          <h2
            key={`h1-${index}`}
            className="ai-heading"
          >
            <InlineMarkdown
              text={line.substring(2)}
            />
          </h2>
        );

        return;
      }

      if (line.startsWith("## ")) {

        flushLists();

        elements.push(
          <h3
            key={`h2-${index}`}
            className="ai-subheading"
          >
            <InlineMarkdown
              text={line.substring(3)}
            />
          </h3>
        );

        return;
      }

      if (line.startsWith("### ")) {

        flushLists();

        elements.push(
          <h4
            key={`h3-${index}`}
            className="ai-small-heading"
          >
            <InlineMarkdown
              text={line.substring(4)}
            />
          </h4>
        );

        return;
      }

      if (
        line.startsWith("- ") ||
        line.startsWith("* ") ||
        line.startsWith("• ")
      ) {

        numberedItems.length > 0 &&
          flushLists();

        bulletItems.push(
          line.substring(2)
        );

        return;
      }

      const numberedMatch =
        line.match(
          /^\d+\.\s+(.*)$/
        );

      if (numberedMatch) {

        bulletItems.length > 0 &&
          flushLists();

        numberedItems.push(
          numberedMatch[1]
        );

        return;
      }

      flushLists();

      elements.push(
        <p
          key={`p-${index}`}
          className="ai-paragraph"
        >
          <InlineMarkdown
            text={line}
          />
        </p>
      );
    }
  );

  flushLists();

  return (
    <div className="formatted-ai-response">
      {elements}
    </div>
  );
}

// ============================================================
// INLINE MARKDOWN
// ============================================================

function InlineMarkdown({
  text
}) {
  if (!text) {
    return null;
  }

  const parts =
    String(text).split(
      /(\*\*.*?\*\*)/
    );

  return (
    <>
      {parts.map(
        (part, index) => {

          if (
            part.startsWith("**") &&
            part.endsWith("**")
          ) {

            return (
              <strong key={index}>
                {part.slice(2, -2)}
              </strong>
            );
          }

          return (
            <span key={index}>
              {part}
            </span>
          );
        }
      )}
    </>
  );
}

// ============================================================
// RESULT BOX
// ============================================================

function ResultBox({
  text
}) {
  return (
    <div className="result-box">

      <div className="result-label">
        🤖 India Companion
      </div>

      <div className="result-text">

        <FormattedResponse
          text={text}
        />

      </div>

    </div>
  );
}

export default App;