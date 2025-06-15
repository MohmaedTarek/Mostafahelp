// Helper function to get image for place
const getImageForPlace = (place) => {
    // Try multiple image field possibilities
    const imageFields = [
        place.imageUrl,
        place.image_1,
        place.image,
        place.firstImage,
        place.ImageURL,
        place.Image
    ];

    // Find first valid image URL
    for (const imageField of imageFields) {
        if (imageField && typeof imageField === 'string' && imageField.trim()) {
            return imageField.trim();
        }
    }

    // Category-based fallback images
    const category = place.category || place.Category || 'place';
    const categoryImages = {
        'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
        'Cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop',
        'Hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop',
        'Mosque': 'https://images.unsplash.com/photo-1564769662104-5c1d5ba0ed8d?w=100&h=100&fit=crop',
        'Museum': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
        'Monument': 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=100&h=100&fit=crop'
    };

    return categoryImages[category] || categoryImages['Monument'];
};

// Helper function to get placeholder image
const getPlaceholderImage = (placeName) => {
    return `data:image/svg+xml;base64,${btoa(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#4A00E0"/>
              <text x="50" y="60" font-family="Arial" font-size="32" fill="#fff" text-anchor="middle">
                ${placeName.charAt(0).toUpperCase()}
              </text>
            </svg>
          `)}`;
};

// Helper function to calculate accurate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
};

// Enhanced recommendation request handler with better distance calculation
const handleRecommendationRequest = async (message) => {
    if (!userLocation) {
        const locationResponse = {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'I need your location to provide personalized recommendations. Please enable location access and try again.',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, locationResponse]);
        return;
    }

    try {
        // Extract category or keyword from message
        let category = '';
        let keyword = '';

        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
            category = 'Restaurant';
            keyword = 'restaurant';
        } else if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation')) {
            category = 'Hotel';
            keyword = 'hotel';
        } else if (lowerMessage.includes('cafe') || lowerMessage.includes('coffee')) {
            category = 'Cafe';
            keyword = 'cafe';
        } else if (lowerMessage.includes('mosque') || lowerMessage.includes('monument') || lowerMessage.includes('attraction') || lowerMessage.includes('visit')) {
            category = 'Mosque';
            keyword = 'monument';
        } else {
            // General recommendation
            keyword = message;
        }

        // Call recommendation API
        const requestData = {
            userLatitude: userLocation.latitude,
            userLongitude: userLocation.longitude,
            topN: 5,
            keyword: keyword,
            category: category,
            placeName: '',
            minRating: 3.0
        };

        const response = await fetch(`${API_BASE_URL}/api/recommendation/smart-recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error('Recommendation API failed');
        }

        const recommendations = await response.json();

        if (recommendations && recommendations.length > 0) {
            // Add AI response about recommendations
            const botResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `Great! I found ${recommendations.length} personalized ${category || 'places'} recommendations for you based on your location and preferences:`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);

            // Add recommendations with enhanced distance calculation
            setTimeout(() => {
                const recommendationsResponse = {
                    id: Date.now() + 2,
                    sender: 'bot',
                    text: '',
                    results: recommendations.map(rec => {
                        // Calculate accurate distance if coordinates are available
                        let distanceText = null;
                        if (rec.latitude && rec.longitude && userLocation) {
                            const distance = calculateDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                parseFloat(rec.latitude),
                                parseFloat(rec.longitude)
                            );
                            distanceText = `${distance.toFixed(1)} km away`;
                        } else if (rec.distanceKM) {
                            distanceText = `${rec.distanceKM.toFixed(1)} km away`;
                        }

                        return {
                            ...rec,
                            name: rec.name || rec.Name,
                            address: rec.address || rec.Address,
                            rating: rec.rating || rec.Rating || rec.Attributes,
                            imageUrl: rec.imageUrl || rec.image_1 || rec.image,
                            matchScore: rec.score ? `${Math.round(rec.score * 100)}% match` : null,
                            distanceText: distanceText
                        };
                    }),
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, recommendationsResponse]);
            }, 500);

        } else {
            const noRecommendationsResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'I couldn\'t find specific recommendations right now, but let me show you some popular categories:',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, noRecommendationsResponse]);
            showCategoryOptions();
        }

    } catch (error) {
        console.error('Recommendation error:', error);
        const fallbackResponse = {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'I\'m having trouble getting personalized recommendations right now. Let me show you some popular options:',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackResponse]);
        showCategoryOptions();
    }
};
// Enhanced Chatbot with Recommendation Model Integration
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Chatbot.css';

const API_BASE_URL = 'http://localhost:5207';

const ChatbotComponent = ({ isOpen, setIsOpen }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: 'Hi! I\'m Guidly, your smart Cairo travel assistant. I can help you find specific places, provide personalized recommendations, directions, transportation advice, and answer questions about Cairo. What would you like to know?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const navigate = useNavigate();
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                },
                (error) => {
                    console.error('Location error:', error);
                    // Set default Cairo coordinates
                    setUserLocation({ latitude: 30.0444, longitude: 31.2357 });
                }
            );
        } else {
            // Fallback to Cairo coordinates
            setUserLocation({ latitude: 30.0444, longitude: 31.2357 });
        }
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Enhanced message sending with recommendation integration
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);

        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            // Check if this is a recommendation request
            if (isRecommendationRequest(currentInput)) {
                await handleRecommendationRequest(currentInput);
            } else {
                // Determine if this should use AI-only or database+AI
                const queryType = analyzeQuery(currentInput);

                if (queryType.useAIOnly) {
                    // For directions, transportation, general questions - use AI only
                    await handleAIOnlyQuery(currentInput);
                } else {
                    // For place searches - use both AI and database
                    await handlePlaceQuery(currentInput, queryType);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'Sorry, I\'m having trouble right now. Let me show you some options:',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
            showCategoryOptions();
        } finally {
            setIsTyping(false);
        }
    };

    // Check if message is a recommendation request
    const isRecommendationRequest = (message) => {
        const recommendationKeywords = [
            'recommend', 'suggest', 'find places', 'best places', 'good places',
            'where should i go', 'what should i visit', 'show me places',
            'personalized', 'for me', 'based on', 'similar to'
        ];

        return recommendationKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
        );
    };

    // Handle recommendation requests using the recommendation model
    const handleRecommendationRequest = async (message) => {
        if (!userLocation) {
            const locationResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'I need your location to provide personalized recommendations. Please enable location access and try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, locationResponse]);
            return;
        }

        try {
            // Extract category or keyword from message
            let category = '';
            let keyword = '';

            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
                category = 'Restaurant';
                keyword = 'restaurant';
            } else if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation')) {
                category = 'Hotel';
                keyword = 'hotel';
            } else if (lowerMessage.includes('cafe') || lowerMessage.includes('coffee')) {
                category = 'Cafe';
                keyword = 'cafe';
            } else if (lowerMessage.includes('mosque') || lowerMessage.includes('monument') || lowerMessage.includes('attraction') || lowerMessage.includes('visit')) {
                category = 'Mosque';
                keyword = 'monument';
            } else {
                // General recommendation
                keyword = message;
            }

            // Call recommendation API
            const requestData = {
                userLatitude: userLocation.latitude,
                userLongitude: userLocation.longitude,
                topN: 5,
                keyword: keyword,
                category: category,
                placeName: '',
                minRating: 3.0
            };

            const response = await fetch(`${API_BASE_URL}/api/recommendation/smart-recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Recommendation API failed');
            }

            const recommendations = await response.json();

            if (recommendations && recommendations.length > 0) {
                // Add AI response about recommendations
                const botResponse = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: `Great! I found ${recommendations.length} personalized ${category || 'places'} recommendations for you based on your location and preferences:`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botResponse]);

                // Add recommendations with match scores
                setTimeout(() => {
                    const recommendationsResponse = {
                        id: Date.now() + 2,
                        sender: 'bot',
                        text: '',
                        results: recommendations.map(rec => ({
                            ...rec,
                            name: rec.name || rec.Name,
                            address: rec.address || rec.Address,
                            rating: rec.rating || rec.Rating || rec.Attributes,
                            imageUrl: rec.imageUrl || rec.image_1 || rec.image,
                            matchScore: rec.score ? `${Math.round(rec.score * 100)}% match` : null,
                            distanceText: rec.distanceKM ? `${rec.distanceKM.toFixed(1)} km away` : null
                        })),
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, recommendationsResponse]);
                }, 500);

            } else {
                const noRecommendationsResponse = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: 'I couldn\'t find specific recommendations right now, but let me show you some popular categories:',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, noRecommendationsResponse]);
                showCategoryOptions();
            }

        } catch (error) {
            console.error('Recommendation error:', error);
            const fallbackResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'I\'m having trouble getting personalized recommendations right now. Let me show you some popular options:',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallbackResponse]);
            showCategoryOptions();
        }
    };

    // Analyze query to determine routing strategy
    const analyzeQuery = (query) => {
        const lowerQuery = query.toLowerCase();

        // AI-only queries (directions, transportation, general questions)
        const aiOnlyKeywords = [
            'how to get', 'directions', 'direction', 'how do i get', 'how can i reach',
            'transportation', 'transport', 'taxi', 'uber', 'careem', 'metro', 'bus',
            'train', 'airport', 'flight', 'parking', 'traffic', 'route', 'travel time',
            'cost', 'price', 'how much', 'what time', 'when', 'why', 'what is',
            'tell me about', 'explain', 'how does', 'culture', 'history', 'weather',
            'safety', 'tips', 'advice', 'best time',
            'currency', 'money', 'language', 'customs', 'tradition'
        ];

        // Place search queries
        const placeKeywords = {
            restaurants: ['restaurant', 'food', 'eat', 'dining', 'meal', 'lunch', 'dinner', 'cuisine'],
            hotels: ['hotel', 'stay', 'accommodation', 'sleep', 'lodge', 'resort'],
            cafes: ['cafe', 'coffee', 'cappuccino', 'espresso', 'latte', 'tea'],
            monuments: ['monument', 'attraction', 'visit', 'tourist', 'sightseeing', 'pyramid', 'museum', 'mosque', 'church']
        };

        // Check if it's an AI-only query
        const isAIOnly = aiOnlyKeywords.some(keyword => lowerQuery.includes(keyword));

        if (isAIOnly) {
            return { useAIOnly: true, category: null };
        }

        // Determine place category
        for (const [category, keywords] of Object.entries(placeKeywords)) {
            if (keywords.some(keyword => lowerQuery.includes(keyword))) {
                return { useAIOnly: false, category: category };
            }
        }

        // Default to AI-only for unclear queries
        return { useAIOnly: true, category: null };
    };

    // Handle AI-only queries
    const handleAIOnlyQuery = async (query) => {
        try {
            const response = await fetch(`${API_BASE_URL}/AI/AskAI`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Question: query,
                    UseAIOnly: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const botResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: data.answer || 'I apologize, I couldn\'t generate a response.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botResponse]);

        } catch (error) {
            console.error('Error with AI query:', error);
            const fallbackResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: getAIFallbackResponse(query),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallbackResponse]);
        }
    };

    // Handle place queries with database results
    const handlePlaceQuery = async (query, queryType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/AI/Ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Question: query,
                    CategoryFilter: queryType.category
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add AI response
            const botResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: data.answer || `Here are some ${queryType.category || 'places'} I found:`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botResponse]);

            // Add places if available
            if (data.places && data.places.length > 0) {
                setTimeout(() => {
                    const placesResponse = {
                        id: Date.now() + 2,
                        sender: 'bot',
                        text: '',
                        results: data.places,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, placesResponse]);
                }, 500);
            } else {
                // Show category options if no results
                setTimeout(() => {
                    showCategoryOptions();
                }, 1000);
            }

        } catch (error) {
            console.error('Error with place query:', error);
            const errorResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'Let me show you some options from our database:',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
            showCategoryOptions();
        }
    };

    // Show category options
    const showCategoryOptions = () => {
        const optionsMessage = {
            id: Date.now() + 3,
            sender: 'bot',
            text: 'What type of place are you looking for?',
            options: [
                { text: '🍽️ Restaurants', action: () => getPlacesByCategory('restaurants') },
                { text: '☕ Cafes', action: () => getPlacesByCategory('cafes') },
                { text: '🏨 Hotels', action: () => getPlacesByCategory('hotels') },
                { text: '🏛️ Monuments', action: () => getPlacesByCategory('monuments') }
            ],
            timestamp: new Date()
        };
        setMessages(prev => [...prev, optionsMessage]);
    };

    // Get places by specific category
    const getPlacesByCategory = async (category) => {
        try {
            // Map frontend categories to backend
            const categoryMap = {
                'restaurants': 'Restaurant',
                'cafes': 'Cafe',
                'hotels': 'Hotel',
                'monuments': 'Monument'
            };

            const backendCategory = categoryMap[category];

            const response = await fetch(`${API_BASE_URL}/API/GetPlacesByCategory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Category: backendCategory,
                    StrictFiltering: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                const placesMessage = {
                    id: Date.now(),
                    sender: 'bot',
                    text: `Here are ${data.places.length} ${category} from our database:`,
                    results: data.places,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, placesMessage]);
            } else {
                const noResultsMessage = {
                    id: Date.now(),
                    sender: 'bot',
                    text: `Sorry, I couldn't find any ${category} in our database right now.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, noResultsMessage]);
            }

        } catch (error) {
            console.error('Error fetching places by category:', error);
            const errorMessage = {
                id: Date.now(),
                sender: 'bot',
                text: `Sorry, I couldn't fetch ${category} right now. Please try again.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    // AI fallback responses
    const getAIFallbackResponse = (query) => {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('direction') || lowerQuery.includes('how to get')) {
            return "For directions in Cairo, I recommend using Google Maps or asking locals. Traffic can be heavy, so allow extra time. Metro is often faster than cars for long distances.";
        } else if (lowerQuery.includes('transport') || lowerQuery.includes('taxi')) {
            return "In Cairo, you can use regular taxis, Uber, Careem, Metro (3 lines), buses, or walk short distances. Always negotiate taxi fares or use ride-sharing apps.";
        } else if (lowerQuery.includes('cost') || lowerQuery.includes('price')) {
            return "Prices in Cairo vary widely. Budget meals: 20-50 EGP, mid-range: 100-200 EGP, luxury: 300+ EGP. Taxis: 10-50 EGP for short rides, Metro: 5-7 EGP.";
        } else {
            return "I'm here to help with Cairo travel questions! Ask me about directions, transportation, prices, or let me find specific places for you. Try asking for personalized recommendations!";
        }
    };

    // Handle place click
    const handlePlaceClick = (place) => {
        setSelectedPlace(place);
        setShowModal(true);
    };

    // Handle view location (always available for maps/directions)
    const handleViewLocation = () => {
        if (!selectedPlace) return;

        const placeName = selectedPlace.name || selectedPlace.Name || 'this place';
        const address = selectedPlace.address || selectedPlace.Address || 'Cairo, Egypt';
        const googleLink = selectedPlace.googleMapsLink || selectedPlace.GoogleMapsLink;

        if (googleLink && googleLink.trim() !== '') {
            window.open(googleLink, '_blank');
        } else {
            // Create Google Maps search
            const searchQuery = encodeURIComponent(`${placeName} ${address} Cairo Egypt`);
            window.open(`https://maps.google.com/maps?q=${searchQuery}`, '_blank');
        }
        setShowModal(false);
    };

    // Handle view website (only if URL exists)
    const handleViewWebsite = () => {
        if (!selectedPlace) return;

        const websiteURL = selectedPlace.detailURL || selectedPlace.DetailURL;

        if (websiteURL && websiteURL.trim() !== '') {
            window.open(websiteURL, '_blank');
        }

        setShowModal(false);
    };

    // Check if place has website URL
    const hasWebsiteURL = (place) => {
        const websiteURL = place?.detailURL || place?.DetailURL;
        return websiteURL && websiteURL.trim() !== '';
    };

    // Only render if open
    if (!isOpen) return null;

    return (
        <>
            {/* Main Chatbot Container */}
            <div className="chatbot-container">
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="bot-avatar">
                            🤖
                        </div>
                        <div>
                            <h3>Guidly</h3>
                            <span className="status">Online</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="close-button">
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.sender}`}>
                            {message.text && (
                                <div className="message-content">{message.text}</div>
                            )}

                            {message.options && (
                                <div className="chat-options">
                                    {message.options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={option.action}
                                            className="chat-option-button"
                                        >
                                            {option.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {message.results && (
                                <div className="chat-results">
                                    {message.results.map((result, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handlePlaceClick(result)}
                                            className="chat-result-item"
                                        >
                                            <img
                                                src={getImageForPlace(result)}
                                                alt={result.name || result.Name}
                                                className="chat-result-image"
                                                onError={(e) => {
                                                    const placeName = result.name || result.Name || 'P';
                                                    e.target.src = getPlaceholderImage(placeName);
                                                }}
                                            />
                                            <div className="chat-result-details">
                                                <h4>{result.name || result.Name || 'Unknown Place'}</h4>
                                                <p className="address">{result.address || result.Address || 'Cairo, Egypt'}</p>
                                                <div className="chat-result-info">
                                                    <span className="chat-result-rating">⭐ {result.rating || result.Rating || result.Attributes || '4.5'}</span>
                                                    {(result.visitingHours || result.VisitingHours) && (
                                                        <span className="chat-result-hours">🕒 {result.visitingHours || result.VisitingHours}</span>
                                                    )}
                                                    {result.matchScore && (
                                                        <span className="match-score">🎯 {result.matchScore}</span>
                                                    )}
                                                    {result.distanceText && (
                                                        <span className="distance-text">📍 {result.distanceText}</span>
                                                    )}
                                                </div>
                                                <p className="click-hint">Click for more details</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message bot typing">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input">
                    <div className="input-container">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask for recommendations, directions, transportation, or anything about Cairo..."
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            style={{ color: '#1a202c' }}
                        />
                        <button onClick={sendMessage} className="send-button" disabled={!input.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Modal */}
            {showModal && selectedPlace && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedPlace.name || selectedPlace.Name || 'Place Details'}</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <img
                                src={getImageForPlace(selectedPlace)}
                                alt={selectedPlace.name || selectedPlace.Name}
                                className="modal-image"
                                onError={(e) => {
                                    const placeName = selectedPlace.name || selectedPlace.Name || 'Place';
                                    e.target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="500" height="250" xmlns="http://www.w3.org/2000/svg">
                      <rect width="500" height="250" fill="#4A00E0"/>
                      <text x="250" y="140" font-family="Arial" font-size="48" fill="#fff" text-anchor="middle">
                        ${placeName.charAt(0).toUpperCase()}
                      </text>
                    </svg>
                  `)}`;
                                }}
                            />

                            <div className="modal-info">
                                <div className="info-row">
                                    <span className="label">📍 Address:</span>
                                    <span>{selectedPlace.address || selectedPlace.Address || 'Cairo, Egypt'}</span>
                                </div>

                                <div className="info-row">
                                    <span className="label">⭐ Rating:</span>
                                    <span>{selectedPlace.rating || selectedPlace.Rating || selectedPlace.Attributes || '4.5'}/5</span>
                                </div>

                                {(selectedPlace.visitingHours || selectedPlace.VisitingHours) && (
                                    <div className="info-row">
                                        <span className="label">🕒 Hours:</span>
                                        <span>{selectedPlace.visitingHours || selectedPlace.VisitingHours}</span>
                                    </div>
                                )}

                                {selectedPlace.matchScore && (
                                    <div className="info-row">
                                        <span className="label">🎯 Match Score:</span>
                                        <span>{selectedPlace.matchScore}</span>
                                    </div>
                                )}

                                {selectedPlace.distanceText && (
                                    <div className="info-row">
                                        <span className="label">📍 Distance:</span>
                                        <span>{selectedPlace.distanceText}</span>
                                    </div>
                                )}

                                <div className="description">
                                    <h4>About this place:</h4>
                                    <p>{selectedPlace.fullDescription ||
                                        selectedPlace.FullDescription ||
                                        selectedPlace.shortDescription ||
                                        selectedPlace.ShortDescription ||
                                        'A wonderful place to visit in Cairo.'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={handleViewLocation} className="action-button primary">
                                <span className="button-icon">📍</span>
                                View Location
                            </button>

                            {hasWebsiteURL(selectedPlace) ? (
                                <button onClick={handleViewWebsite} className="action-button secondary">
                                    <span className="button-icon">🌐</span>
                                    View Website
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        navigate(`/near-me?category=${selectedPlace.category}&placeId=${selectedPlace.id}`);
                                        setShowModal(false);
                                    }}
                                    className="action-button secondary"
                                >
                                    <span className="button-icon">🔍</span>
                                    Explore Similar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatbotComponent;