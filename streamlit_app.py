import datetime

import plotly.graph_objects as go
import streamlit as st

# -----------------------------------------------------------------------------
# Model configuration
# -----------------------------------------------------------------------------
USD_TO_INR = 84

LOCATIONS = {
    "Downtown Metro": 620,
    "Uptown": 480,
    "Riverside": 350,
    "Midtown": 280,
    "Green Valley": 190,
    "Sunset Heights": 160,
}

PROPERTY_TYPES = {
    "Apartment": 0.95,
    "House": 1.00,
    "Condo": 1.05,
    "Townhouse": 1.10,
    "Villa": 1.22,
}

CONDITIONS = {
    "New": 45_000,
    "Renovated": 22_000,
    "Average": 0,
    "Fixer-upper": -35_000,
}

BED_VALUE = 25_000
BATH_VALUE = 18_000
PARK_VALUE = 12_000
NEW_PREMIUM = 25_000
YEARLY_DEP = 800
OLD_AGE_THRESHOLD = 50
OLD_AGE_EXTRA = 500
MIN_PRICE = 50_000


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def get_current_year():
    return datetime.date.today().year


def format_usd(value: float) -> str:
    return f"${value:,.0f}"


def format_inr_full(value_usd: float) -> str:
    inr = value_usd * USD_TO_INR
    return f"₹{inr:,.0f}"


def format_inr_compact(value_usd: float) -> str:
    inr = value_usd * USD_TO_INR
    crore = 10_000_000
    lakh = 100_000
    if inr >= crore:
        return f"₹{inr / crore:,.2f} Cr"
    if inr >= lakh:
        return f"₹{inr / lakh:,.2f} L"
    return f"₹{inr:,.0f}"


def format_currency(value: float, currency: str, compact: bool = False) -> str:
    if currency == "INR":
        return format_inr_compact(value) if compact else format_inr_full(value)
    return f"${value:,.0f}"


def get_local_median(location_rate: float, current_year: int) -> float:
    area = 1500
    beds = 3
    baths = 2
    parking = 1
    condition_adj = 0
    type_mult = 1.0
    age = max(0, current_year - 2015)
    age_adj = min(
        0,
        -min(age, OLD_AGE_THRESHOLD) * YEARLY_DEP
        - max(0, age - OLD_AGE_THRESHOLD) * OLD_AGE_EXTRA,
    )
    return (
        area * location_rate * type_mult
        + beds * BED_VALUE
        + baths * BATH_VALUE
        + parking * PARK_VALUE
        + condition_adj
        + age_adj
    )


def predict_price(
    location: str,
    property_type: str,
    condition: str,
    area: float,
    year_built: int,
    bedrooms: int,
    bathrooms: float,
    parking: int,
):
    current_year = get_current_year()
    location_rate = LOCATIONS[location]
    type_mult = PROPERTY_TYPES[property_type]
    condition_adj = CONDITIONS[condition]

    age = max(0, current_year - year_built)
    if age <= 2:
        age_adj = NEW_PREMIUM
    else:
        age_adj = -min(age, OLD_AGE_THRESHOLD) * YEARLY_DEP - max(
            0, age - OLD_AGE_THRESHOLD
        ) * OLD_AGE_EXTRA

    base = area * location_rate
    type_adj = base * (type_mult - 1)
    bed_adj = bedrooms * BED_VALUE
    bath_adj = bathrooms * BATH_VALUE
    park_adj = parking * PARK_VALUE

    price = max(
        MIN_PRICE,
        base + type_adj + bed_adj + bath_adj + park_adj + condition_adj + age_adj,
    )

    factors = [
        (f"Location & area ({location})", base),
        (f"Property type ({property_type})", type_adj),
        ("Bedrooms", bed_adj),
        ("Bathrooms", bath_adj),
        ("Parking", park_adj),
        (f"Condition ({condition})", condition_adj),
        ("Year built", age_adj),
    ]
    factors = [(label, val) for label, val in factors if val != 0]
    factors.sort(key=lambda x: abs(x[1]), reverse=True)

    confidence = 96
    if age > OLD_AGE_THRESHOLD:
        confidence -= 4
    if condition == "Fixer-upper":
        confidence -= 3
    if area < 400:
        confidence -= 2
    confidence = max(88, min(98, confidence))

    margin = (100 - confidence) / 100 + 0.05
    low = max(MIN_PRICE, price * (1 - margin))
    high = price * (1 + margin)

    median = get_local_median(location_rate, current_year)
    diff_percent = ((price - median) / median) * 100

    return {
        "price": price,
        "low": low,
        "high": high,
        "price_per_sqft": price / area,
        "confidence": confidence,
        "factors": factors,
        "median": median,
        "diff_percent": diff_percent,
        "location": location,
    }


# -----------------------------------------------------------------------------
# Visualizations
# -----------------------------------------------------------------------------
def confidence_gauge(confidence: int):
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=confidence,
            number={"suffix": "%", "font": {"size": 28, "color": "#0f172a"}},
            domain={"x": [0, 1], "y": [0, 1]},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1},
                "bar": {"color": "#10b981"},
                "bgcolor": "white",
                "borderwidth": 1,
                "bordercolor": "#e2e8f0",
                "steps": [
                    {"range": [0, 60], "color": "#f1f5f9"},
                    {"range": [60, 85], "color": "#ecfdf5"},
                    {"range": [85, 100], "color": "#d1fae5"},
                ],
                "threshold": {
                    "line": {"color": "#059669", "width": 3},
                    "thickness": 0.8,
                    "value": confidence,
                },
            },
        )
    )
    fig.update_layout(
        height=220,
        margin={"l": 20, "r": 20, "t": 20, "b": 20},
        paper_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def price_range_gauge(low: float, price: float, high: float, currency: str):
    fig = go.Figure()
    fig.add_hrect(y0=0.25, y1=0.75, fillcolor="#f1f5f9", line_width=0)
    fig.add_trace(
        go.Scatter(
            x=[low, price, high],
            y=[0.5, 0.5, 0.5],
            mode="markers+text",
            marker={"size": [10, 22, 10], "color": ["#94a3b8", "#10b981", "#94a3b8"]},
            text=[
                format_currency(low, currency, compact=True),
                format_currency(price, currency, compact=True),
                format_currency(high, currency, compact=True),
            ],
            textposition=["bottom center", "top center", "bottom center"],
            textfont={"size": 12, "color": "#475569"},
            hoverinfo="skip",
        )
    )
    fig.add_shape(
        type="line",
        x0=low,
        x1=high,
        y0=0.5,
        y1=0.5,
        line={"color": "#10b981", "width": 4},
    )
    fig.update_layout(
        height=140,
        xaxis={"visible": False, "range": [low - (high - low) * 0.05, high + (high - low) * 0.05]},
        yaxis={"visible": False, "range": [0, 1]},
        margin={"l": 10, "r": 10, "t": 30, "b": 10},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def feature_importance_chart(factors, currency: str):
    labels = [f[0] for f in factors]
    values = [f[1] for f in factors]
    colors = ["#10b981" if v >= 0 else "#f43f5e" for v in values]

    fig = go.Figure(
        go.Bar(
            x=values,
            y=labels,
            orientation="h",
            marker={"color": colors, "cornerradius": 4},
            text=[format_currency(abs(v), currency, compact=True) for v in values],
            textposition="outside",
            cliponaxis=False,
        )
    )
    fig.update_layout(
        height=max(250, len(factors) * 45),
        margin={"l": 180, "r": 80, "t": 10, "b": 20},
        xaxis={"title": "Contribution", "tickprefix": "$" if currency == "USD" else "₹"},
        yaxis={"autorange": "reversed"},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#334155"},
    )
    return fig


def cost_breakdown_chart(factors, currency: str):
    # Use absolute contributions for the pie
    labels = [f[0] for f in factors[:4]]
    values = [abs(f[1]) for f in factors[:4]]
    if len(factors) > 4:
        labels.append("Other factors")
        values.append(sum(abs(f[1]) for f in factors[4:]))

    colors = ["#10b981", "#34d399", "#2dd4bf", "#06b6d4", "#94a3b8"]
    fig = go.Figure(
        go.Pie(
            labels=labels,
            values=values,
            hole=0.55,
            marker={"colors": colors[: len(labels)], "line": {"color": "white", "width": 2}},
            textinfo="label+percent",
            textposition="outside",
            hovertemplate="%{label}<br>%{value}<extra></extra>",
        )
    )
    fig.update_layout(
        height=320,
        margin={"l": 10, "r": 10, "t": 10, "b": 10},
        paper_bgcolor="rgba(0,0,0,0)",
        showlegend=False,
        annotations=[
            {
                "text": "Top<br>drivers",
                "x": 0.5,
                "y": 0.5,
                "font_size": 14,
                "showarrow": False,
                "font": {"color": "#64748b"},
            }
        ],
    )
    return fig


def comparison_chart(predicted: float, median: float, currency: str):
    labels = ["Predicted price", "Local median"]
    values = [predicted, median]
    colors = ["#10b981", "#94a3b8"]

    fig = go.Figure(
        go.Bar(
            x=labels,
            y=values,
            marker={"color": colors, "cornerradius": 4},
            text=[format_currency(v, currency, compact=True) for v in values],
            textposition="outside",
        )
    )
    fig.update_layout(
        height=260,
        margin={"l": 20, "r": 20, "t": 20, "b": 10},
        yaxis={"tickprefix": "$" if currency == "USD" else "₹"},
        xaxis={"title": ""},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#334155"},
    )
    return fig


# -----------------------------------------------------------------------------
# Streamlit UI
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="House Price Predictor",
    page_icon="🏠",
    layout="wide",
)

st.markdown(
    """
    <style>
    .block-container { padding-top: 2rem; }
    .stButton>button { background-color: #10b981; color: white; border-radius: 0.6rem; font-weight: 600; }
    .stButton>button:hover { background-color: #059669; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("🏠 House Price Predictor")
st.markdown(
    "Enter the property details below and the valuation model will generate an instant price estimate with key insights."
)

current_year = get_current_year()

with st.container():
    left, right = st.columns([1, 1.25], gap="large")

    with left:
        st.subheader("Property details")
        with st.form("prediction_form"):
            location = st.selectbox("Location *", options=list(LOCATIONS.keys()))
            col1, col2 = st.columns(2)
            with col1:
                property_type = st.selectbox("Property type *", options=list(PROPERTY_TYPES.keys()))
            with col2:
                condition = st.selectbox("Condition *", options=list(CONDITIONS.keys()))

            area = st.number_input(
                "Living area (sq ft) *",
                min_value=100,
                max_value=50_000,
                value=1_600,
                step=50,
            )
            year_built = st.number_input(
                "Year built *",
                min_value=1800,
                max_value=current_year + 1,
                value=2015,
                step=1,
            )

            c1, c2, c3 = st.columns(3)
            with c1:
                bedrooms = st.number_input("Bedrooms *", min_value=0, max_value=20, value=3, step=1)
            with c2:
                bathrooms = st.number_input(
                    "Bathrooms *", min_value=0.5, max_value=20.0, value=2.0, step=0.5
                )
            with c3:
                parking = st.number_input("Parking spots *", min_value=0, max_value=20, value=1, step=1)

            submitted = st.form_submit_button("Generate price prediction")

    # Validation + prediction
    prediction = None
    if submitted:
        errors = []
        if not location:
            errors.append("Please select a location.")
        if area < 100 or area > 50_000:
            errors.append("Living area must be between 100 and 50,000 sq ft.")
        if bedrooms < 0 or bedrooms > 20:
            errors.append("Bedrooms must be between 0 and 20.")
        if bathrooms < 0.5 or bathrooms > 20:
            errors.append("Bathrooms must be between 0.5 and 20.")
        if parking < 0 or parking > 20:
            errors.append("Parking spots must be between 0 and 20.")
        if year_built < 1800 or year_built > current_year + 1:
            errors.append(f"Year built must be between 1800 and {current_year + 1}.")

        if errors:
            for err in errors:
                st.error(err)
        else:
            with st.spinner("Running valuation model..."):
                prediction = predict_price(
                    location,
                    property_type,
                    condition,
                    float(area),
                    int(year_built),
                    int(bedrooms),
                    float(bathrooms),
                    int(parking),
                )

    with right:
        st.subheader("Estimated market value")
        if prediction is None:
            st.info(
                "Complete the form and click **Generate price prediction** to see your estimate and insights."
            )
        else:
            currency = st.radio(
                "Currency",
                options=["USD", "INR"],
                horizontal=True,
                label_visibility="collapsed",
            )

            primary = format_currency(prediction["price"], currency)
            secondary = format_currency(
                prediction["price"], "INR" if currency == "USD" else "USD"
            )

            st.markdown(
                f"""
                <div style='text-align:center; margin-bottom: 1rem;'>
                    <h1 style='color:#064e3b; margin:0;'>{primary}</h1>
                    <p style='color:#64748b; margin:0.2rem 0 0 0; font-size: 1rem;'>≈ {secondary}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            st.plotly_chart(
                price_range_gauge(
                    prediction["low"], prediction["price"], prediction["high"], currency
                ),
                use_container_width=True,
                config={"displayModeBar": False},
            )

            m1, m2, m3, m4 = st.columns(4)
            with m1:
                st.metric("Price / sq ft", format_currency(prediction["price_per_sqft"], currency))
            with m2:
                st.metric("Local median", format_currency(prediction["median"], currency))
            with m3:
                diff = prediction["diff_percent"]
                st.metric(
                    "vs. local median",
                    f"{abs(diff):.1f}%",
                    delta=f"{'above' if diff >= 0 else 'below'} median",
                    delta_color="normal" if diff >= 0 else "inverse",
                )
            with m4:
                st.plotly_chart(
                    confidence_gauge(prediction["confidence"]),
                    use_container_width=True,
                    config={"displayModeBar": False},
                )

            tab1, tab2 = st.tabs(["Market comparison", "Cost breakdown & drivers"])
            with tab1:
                st.plotly_chart(
                    comparison_chart(prediction["price"], prediction["median"], currency),
                    use_container_width=True,
                    config={"displayModeBar": False},
                )
            with tab2:
                c1, c2 = st.columns([1, 1.1])
                with c1:
                    st.plotly_chart(
                        cost_breakdown_chart(prediction["factors"], currency),
                        use_container_width=True,
                        config={"displayModeBar": False},
                    )
                with c2:
                    st.plotly_chart(
                        feature_importance_chart(prediction["factors"], currency),
                        use_container_width=True,
                        config={"displayModeBar": False},
                    )

            st.caption(
                f"Location: **{prediction['location']}** · Area: **{area:,.0f} sq ft** · "
                f"{int(bedrooms)} bed · {bathrooms} bath · {int(parking)} parking · Built {int(year_built)}"
            )

st.divider()
st.caption(
    "This estimate is generated by a client-side valuation model for demonstration purposes and should not replace a professional appraisal."
)
