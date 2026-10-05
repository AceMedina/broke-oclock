# Broke O'Clock

A satirical web dashboard that calculates how many working years, 15/30 paydays, and everyday trade-offs it takes to afford a luxury watch based on your salary.

---

## Broke O'Clock Logic

Broke O'Clock gives luxury watch enthusiasts a reality check. Enter your monthly salary and savings rate to see the true cost of owning high-end timepieces:

* **Years of Work:** Total continuous working years required to pay for the watch.
* **Paydays Needed:** How many 15/30 cutoffs you need to save through.
* **Work Hours:** Total hours on the clock needed to fund the purchase.
* **Trade-Offs:** What the same amount could buy instead (Chickenjoy meals, Spanish Lattes, flagship phones, or studio apartment rent).

---

## How the Website Uses the API

Watch details and market prices come from a FastAPI backend (`https://watch-api-eight.vercel.app`):

1. **Watch Search:** Typing in the search bar calls `/api/v1/watches/search?q={query}` to show matching watches by brand, model, or nickname.
2. **Loads Specifications:** Selecting a watch displays its image, price (PHP), case size, movement, type, country of origin, reference number, and power reserve.
3. **Local Images:** Uses matching watch filenames from the local `images/` folder for fast and reliable image rendering.

---

## Calculator & Features

* **Salary & Slider Inputs:** Adjust your monthly salary and watch savings cut from 5% up to 100%.
* **Instant Calculation:** All stats, trade-offs, and funny verdict badges update immediately as you type or drag the slider.
* **Fixed Desktop View:** Designed to fit cleanly within a single desktop screen without scrolling or layout jumps.
* **Mobile Ready:** Automatically stacks into a clean, scrollable layout for phones and smaller screens.

---

## Files in This Project

broke-o-clock/
├── images/       # Watch photos and renders
├── index.html    # Page structure and layout
├── style.css     # Design, colors, and responsive styling
├── app.js        # Calculator logic and API integration
└── README.md     # Project overview