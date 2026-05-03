# Datify: Telecom Data Usage Predictor

## 🌍 What is Datify?
Datify is an advanced, AI-powered web application designed to predict a customer's monthly mobile data consumption (in Gigabytes). By analyzing a user's demographics (age, salary, city) and their daily digital habits (streaming hours, gaming, social media, and Wi-Fi reliance), the system accurately forecasts how much cellular data they will need.

### 🏢 Industry Use Cases
- **Telecom Providers (ISPs):** Can proactively offer personalized data plans or top-up packs to customers right before they run out of data, improving customer satisfaction.
- **Network Load Balancing:** Helps telecom engineers predict heavy data consumption in specific cities or regions by analyzing the demographics of users in that area.
- **Customer Retention & Marketing:** By understanding the correlation between a customer's estimated salary, usage, and telecom partner, companies can offer targeted discounts to prevent users from switching networks.

---

## 🏗️ How it Works (The Architecture)
This project is built using a modern "Microservices" architecture. It is split into three main pieces that talk to each other seamlessly:

### 1. The Frontend (The Face)
- **Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Chart.js.
- **What it does:** This is the beautiful, responsive website where users interact. It handles user logins, displays the dashboard, takes the prediction inputs, and draws the visual graphs and charts using Chart.js.

### 2. The Node.js API Gateway (The Middleman)
- **Tech Stack:** Node.js, Express, MongoDB.
- **What it does:** It acts as a secure traffic controller. When you log in, it verifies your credentials. When you run a prediction, it securely saves your history to a MongoDB database so you can view your past predictions and analytics later. After saving, it forwards your actual prediction request to the Python Brain.

### 3. The Python FastAPI Backend (The Brain)
- **Tech Stack:** Python, FastAPI, Pandas, Scikit-Learn.
- **What it does:** This holds the trained Machine Learning model (`model.pkl`). It receives the user's details from the Node.js server, runs the numbers through its mathematical model, and sends the predicted data usage back down the chain to be displayed on your screen. It also generates Explainable AI (XAI) insights to tell you *why* the data usage is high or low.

---

## 🧠 Understanding the Machine Learning Models (Explained Simply)

In this project, we evaluated three different algorithms to predict data usage. We ultimately chose the **Random Forest** because it was the smartest. Here is how you can explain them to anyone:

### 1. Linear Regression (Accuracy: ~72%)
Imagine drawing a straight line through a scatter plot of dots. It assumes that if you stream twice as much video, you use exactly twice as much data. But the real world isn't a straight line! (What if you stream on Wi-Fi instead of 5G?). Because human behavior is complex and "non-linear," this model is too simple to capture the full picture.

### 2. Gradient Boosting (Accuracy: ~95%)
Think of this as a team of workers building something sequentially. The first worker makes a guess at your data usage. The second worker looks at what the first worker got wrong, and tries to fix *only* those specific mistakes. The third worker fixes the second's mistakes, and so on. It's highly accurate, but sometimes it overthinks and memorizes the training data too much (a problem called "overfitting").

### 3. Random Forest (🏆 Our Chosen Model - Accuracy: ~97%)
Imagine asking 30 different experts (called "Decision Trees") to guess your data usage based on different clues. One expert might focus heavily on your age, another looks mostly at your city, and another looks at your gaming hours. 

At the end, they all cast a vote, and we take the average of their guesses. Because they all look at things slightly differently, the group as a whole makes an incredibly accurate prediction. It handles complex human behavior beautifully without getting confused.

---

## 🚀 How to Run the Project

To start the full system, you need to run the three components. It's best to open three separate terminal/command prompt windows.

**1. Start the Machine Learning Brain (Python)**
1. Open a terminal and navigate to the `backend` folder.
2. If you use a virtual environment, activate it.
3. Run the server:
   ```bash
   uvicorn app:app --reload
   ```
   *(This runs the AI engine on `http://localhost:8000`)*

**2. Start the Database & Auth Server (Node.js)**
1. Open a second terminal and navigate to the `node_backend` folder.
2. Run the server:
   ```bash
   npm start
   ```
   *(This runs the API Gateway on `http://localhost:5000`)*

**3. Open the Website**
1. Open your file explorer and navigate to the `frontend` folder.
2. Double-click on `index.html` to open it directly in your web browser.

Once everything is running, you can create an account on the website, log in, and start predicting data usage!
