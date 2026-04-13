const zlib = require('zlib');
const fs = require('fs');
const https = require('https');

const diagram = `flowchart TD
    classDef entity fill:#f0f8ff,stroke:#00509e,stroke-width:2px;
    classDef process fill:#e6ffe6,stroke:#006600,stroke-width:2px;
    classDef datastore fill:#fff0e6,stroke:#cc5200,stroke-width:2px;

    Student[Student]:::entity
    Teacher[Teacher]:::entity
    ML_Model[ML Model]:::entity

    P1((1. User Authentication)):::process
    P2((2. Student Data Management)):::process
    P3((3. Prediction Processing)):::process
    P4((4. Recommendation & Career Suggestion)):::process
    P5((5. Analytics & Reporting)):::process

    D1[(Users Database)]:::datastore
    D2[(Students Database)]:::datastore
    D3[(Predictions Database)]:::datastore

    Student -->|Authentication| P1
    P1 -->|User Credentials/Token| D1

    Student -->|Submit Academic Data| P2
    P2 -->|Store Academic Data| D2

    D2 -->|Fetch Student Records| P3
    P3 -->|Request Prediction| ML_Model
    ML_Model -->|Prediction Results| P3

    P3 -->|Save Prediction Results| D3
    P3 -->|Pass Result Data| P4
    P4 -->|Recommendation| Student

    Teacher -->|Authentication| P1

    Teacher -->|View Students Request| P2
    P2 -->|Query Student Records| D2
    D2 -->|Return Student Data| P2
    P2 -->|Display Students| Teacher

    Teacher -->|View Predictions Request| P5
    P5 -->|Query Prediction Records| D3
    D3 -->|Return Prediction Data| P5
    P5 -->|Analytics & Reporting| Teacher`;

const buffer = zlib.deflateSync(Buffer.from(diagram, 'utf8'));
const base64 = buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const url = `https://kroki.io/mermaid/png/${base64}?scale=3`;

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error("Failed to download image. Status:", res.statusCode);
        return;
    }
    const file = fs.createWriteStream("Student_Performance_DFD.png");
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("Image successfully saved as Student_Performance_DFD.png");
    });
}).on('error', (err) => {
    console.error("Error downloading image:", err.message);
});
