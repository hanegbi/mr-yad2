const extractPrice = (card) => {
  const priceEl = card.querySelector(
    'span.feed-item-price_price__ygoeF[data-testid="price"]'
  );
  if (!priceEl) {
    return null;
  }

  const priceText = priceEl.textContent;
  if (priceText.includes("לא צוין מחיר")) {
    return null;
  }

  const price = parseInt(priceText.replace(/\D/g, ""), 10);

  if (isNaN(price) || price < 10) {
    return null;
  }

  return price;
};

const extractSqm = (card) => {
  const infoEl = card.querySelector(
    'span.item-data-content_itemInfoLine__AeoPP[data-testid="item-info-line-2nd"]'
  );
  if (!infoEl) {
    return null;
  }

  const match = infoEl.textContent.match(/(\d+(?:,\d{3})*|\d+)\s*מ״ר/);
  if (!match) {
    return null;
  }

  const sqm = parseInt(match[1].replace(/,/g, ""), 10);

  if (isNaN(sqm) || sqm === 0) {
    return null;
  }

  return sqm;
};

const formatNumber = (n) => Math.round(n).toLocaleString("en-US");

const createBadge = (value) => {
  const badge = document.createElement("span");
  badge.className = "mr-yad2-badge";
  badge.textContent = formatNumber(value);
  badge.dataset.pricePerSqm = value;
  return badge;
};

const processCard = (card) => {
  if (card.dataset.mrYad2Done) {
    return;
  }

  const price = extractPrice(card);
  const sqm = extractSqm(card);

  if (!price || !sqm) {
    card.dataset.mrYad2Done = "1";
    return;
  }

  const pricePerSqm = price / sqm;
  const badge = createBadge(pricePerSqm);
  const cardContainer = card.closest('[data-testid*="feed-item"]') || card;

  if (!cardContainer.style.position || cardContainer.style.position === 'static') {
    cardContainer.style.position = 'relative';
  }

  cardContainer.appendChild(badge);
  card.dataset.mrYad2Done = "1";
};

const updateBadgeColors = () => {
  const allBadges = document.querySelectorAll('.mr-yad2-badge');
  if (allBadges.length === 0) return;

  const sorted = Array.from(allBadges)
    .map(badge => parseFloat(badge.dataset.pricePerSqm))
    .sort((a, b) => a - b);

  const lowThreshold = sorted[Math.floor(sorted.length * 0.3)];
  const highThreshold = sorted[Math.floor(sorted.length * 0.7)];

  allBadges.forEach(badge => {
    const value = parseFloat(badge.dataset.pricePerSqm);
    
    if (value >= highThreshold) {
      badge.style.color = '#bb0101';
    } else if (value <= lowThreshold) {
      badge.style.color = '#01bb01';
    } else {
      badge.style.color = '#555';
    }
  });
};

const scan = () => {
  let cards = document.querySelectorAll('[data-testid*="feed-item"]');
  
  if (cards.length === 0) {
    cards = document.querySelectorAll('.item-data-content_itemDataContentBox__gvAC2');
  }
  
  cards.forEach(processCard);
  updateBadgeColors();
};

const observe = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        scan();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    scan();
    observe();
  });
} else {
  scan();
  observe();
}

