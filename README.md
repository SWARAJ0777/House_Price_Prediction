# House Price Predictor

A professional, green-and-white house price prediction web app with both a React/Vite frontend and a standalone Streamlit version.

## Project structure

```
.
├── index.html                    # Vite entry HTML
├── package.json                  # React/Vite dependencies
├── vite.config.ts                # Vite + single-file plugin config
├── requirements.txt              # Python deps for Streamlit version
├── streamlit_app.py              # Streamlit version of the app
├── src/
│   ├── App.tsx                   # Main React app
│   ├── main.tsx                  # React mount point
│   ├── index.css                 # Tailwind CSS import
│   ├── lib/model.ts              # Prediction model, locations, formatting
│   ├── utils/cn.ts               # Tailwind class merge utility
│   ├── components/
│   │   ├── PredictionForm.tsx    # Input form with validation
│   │   ├── ResultCard.tsx        # Prediction result + visualizations
│   │   ├── FeatureBarChart.tsx   # Horizontal feature-importance bars
│   │   ├── ConfidenceRing.tsx    # SVG confidence ring
│   │   ├── PriceRangeGauge.tsx   # Range gauge
│   │   ├── ComparisonBars.tsx    # Predicted vs median bars
│   │   └── BreakdownDonut.tsx    # Donut cost-breakdown chart
│   └── components/ui/            # Reusable UI primitives
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       └── Select.tsx
└── dist/index.html               # Built single-file web app
```

## Run the React web app

```bash
npm install
npm run build
```

The built app is output to `dist/index.html` as a single self-contained file.

## Run the Streamlit app

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

The Streamlit version mirrors the same model, USD/INR support, and visualizations.
