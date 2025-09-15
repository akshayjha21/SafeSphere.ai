# 🚺 SafeSphere.AI 🛡

Welcome to our *SafeSphere.AI* project designed to empower women online by providing real-time *privacy protection, harassment detection, and stalking defense* across popular platforms like Gmail, Twitter, Instagram, and Facebook.

---

## ✨ Key Features

- 🔍 *Real-time Text Toxicity Detection* using *Bytez.js AI models*  
- 🖼 *Image Moderation* powered by the *Sightengine API* to detect unsafe visuals (nudity, violence, self-harm)  
- ♻ *Redis Cache* for lightning-fast responses and reduced API overhead  
- 🔐 *Privacy-First Architecture:* Temporary caching, SHA-256 hashed keys, encrypted API calls  
- 🌐 *Cross-Platform Support:* Works seamlessly on Gmail, Twitter, Instagram, Facebook  
- ⚡ *Lightweight Chrome Extension:* Easy to install, minimal setup  
- 🚨 Instant alerts and warnings to protect users before exposure  
- 📊 Scalable backend with Node.js & Express API handles moderation efficiently  
- ☁ Secure cloud storage for flagged content and audit logs  

---

## 🛠 Technology Stack

| Component            | Technology / Library                  | Purpose                                              |
|----------------------|---------------------------------------|------------------------------------------------------|
| Frontend Extension   | Chrome Extension, Manifest v3         | Real-time client-side content capture & UI           |
| Text Moderation      | Bytez.js AI Model                     | Toxicity & harassment detection in text              |
| Image Moderation     | Sightengine API                       | Automated unsafe content detection in images         | 
| Backend API          | Node.js, Express.js                   | Moderation API & orchestration                       |
| Caching              | Redis                                 | Fast result caching & reduced repeated processing    |
| Cloud Storage        | AWS S3 or equivalent                  | Secure storage of flagged content                    |
| Security             | SHA-256, HTTPS, Token Auth, CORS      | Data security, encryption, and access protection     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)  
- npm (Node package manager)  
- Google Chrome browser  

### Installation

1. *Clone the repository:*  
git clone https://github.com/akshayjha21/SafeSphere.ai.git
cd SafeSphere.ai

text

2. *Install backend dependencies:*  
cd backend
npm install

text

3. *Start the backend server:*  
npm start

or
node app.js

text

4. *Load Extension in Chrome:*  
- Open Chrome and go to chrome://extensions/  
- Enable *Developer Mode* (toggle top right)  
- Click *Load unpacked* and select the /extension folder  

---

## 🧩 How It Works

1. User browses supported platforms (Gmail, Twitter, Facebook, Instagram).  
2. The *Chrome Extension Content Script* captures page content (text + images).  
3. Content is sent via secure API calls to the *Moderation API backend*.  
4. Text is analyzed using *Bytez.js AI toxicity models* for harassment detection.  
5. Images are sent to *Sightengine* for unsafe content evaluation.  
6. Moderation results are cached in *Redis* for fast repeated responses.  
7. Alerts and flags are displayed instantly in the user's browser UI.  
8. Flagged data is securely stored in cloud for audits and pattern analysis.

---

## 🔒 Privacy & Security

- All user data is processed *securely and temporarily*; data cached for only a few minutes.  
- Uses *SHA-256 hashing* to anonymize cache keys and prevent collisions.  
- API communications secured via HTTPS and token-based authentication.  
- Strict *CORS policies* safeguard the backend from unauthorized access.

---
## 🎨 System Architecture
<img width="600" height="596" alt="Screenshot 2025-09-15 201910" src="https://github.com/user-attachments/assets/1a2b2b4e-c5de-481d-8e39-7eb0e62e6549" />


## 🎨 Screenshots & Demo

  <img width="600" height="873" alt="Screenshot 2025-09-15 202506" src="https://github.com/user-attachments/assets/dbf276fa-c636-4751-8f43-e440a54c27d1" />
  <img width="600" height="828" alt="Screenshot 2025-09-15 202730" src="https://github.com/user-attachments/assets/423bddfe-a3e9-44e7-b8ff-dcad5df16d20" />
  <img width="600" height="734" alt="Screenshot 2025-09-15 203631" src="https://github.com/user-attachments/assets/51997d2f-e22a-405d-9ff5-b7d63124c775" />



---

## 🙌 Contribution

Contributions and suggestions are welcome! Please open issues or submit pull requests to help us improve this vital tool.

## 🚩 Acknowledgements

- Bytez.js team for advanced AI toxicity models  
- Sightengine API for reliable image moderation  
- Redis community for caching solutions  
- AWS for cloud storage and infrastructure support  

---

# Let's make the internet safe for everyone, starting with protecting women online


