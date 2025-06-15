import { getPlacesByCategory } from '../utils/api'; // Adjust the path if needed

// Asynchronous filter function using API
export const filterPlaces = async (category, budget, rating) => {
    const response = await getPlacesByCategory(category);
    if (!response.success || !Array.isArray(response.data)) {
        console.warn(`Could not fetch places for category: ${category}`);
        return [];
    }

    const places = response.data;

    const hotelPriceThresholds = {
        1: 1200,
        2: 2000,
        3: 3000,
        4: Infinity
    };

    return places.filter(place => {
        const rawRating = parseFloat(place.Attributes || place.Attributes || 0);

        let priceCriteria = true;
        if (category === 'Hotel') {
            const price = parseFloat(place.price_per_night || 0);

            if (budget === 1) priceCriteria = price < hotelPriceThresholds[1];
            else if (budget === 2) priceCriteria = price >= hotelPriceThresholds[1] && price < hotelPriceThresholds[2];
            else if (budget === 3) priceCriteria = price >= hotelPriceThresholds[2] && price < hotelPriceThresholds[3];
            else if (budget === 4) priceCriteria = price >= hotelPriceThresholds[3];
        } else {
            const priceLevel = parseInt(place.priceLevel || 4);
            priceCriteria = priceLevel <= budget;
        }

        const ratingCriteria = rawRating >= rating;

        return priceCriteria && ratingCriteria;
    });
};

// Optional utility function
export const getEgyptianPriceRanges = () => ({
    restaurants: {
        1: 'Under 200 EGP',
        2: '200-500 EGP',
        3: '500-1000 EGP',
        4: 'Over 1000 EGP'
    },
    cafes: {
        1: 'Under 100 EGP',
        2: '100-250 EGP',
        3: '250-500 EGP',
        4: 'Over 500 EGP'
    },
    hotels: {
        1: 'Under 1200 EGP',
        2: '1200-2000 EGP',
        3: '2000-3000 EGP',
        4: 'Over 3000 EGP'
    },
    monuments: {
        0: 'Free',
        1: 'Under 100 EGP',
        2: '100-300 EGP',
        3: '300-500 EGP',
        4: 'Over 500 EGP'
    }
});
