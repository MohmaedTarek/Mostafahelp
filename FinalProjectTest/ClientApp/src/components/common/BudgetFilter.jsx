import React, { useState, useEffect } from 'react';

const BudgetFilter = ({ category = 'restaurants', value, onChange }) => {
    const [customBudget, setCustomBudget] = useState('');
    const [activeTab, setActiveTab] = useState('preset');
    const [currentCategory, setCurrentCategory] = useState(category);

    // When category changes, reset to preset view
    useEffect(() => {
        if (category !== currentCategory) {
            setActiveTab('preset');
            setCurrentCategory(category);
        }
    }, [category, currentCategory]);

    // Only show budget filter for hotels
    if (category !== 'hotels') {
        return null;
    }

    // Define price ranges only for hotels (per night in EGP)
    const priceRanges = {
        hotels: {
            1: { label: 'Budget', range: 'Under 1200 EGP' },
            2: { label: 'Standard', range: '1200-2000 EGP' },
            3: { label: 'Premium', range: '2000-3000 EGP' },
            4: { label: 'Luxury', range: 'Over 3000 EGP' }
        }
    };

    // Helper function to determine price level from amount (only for hotels)
    const getPriceLevelFromAmount = (amount) => {
        if (!amount || isNaN(amount)) return null;

        const numAmount = Number(amount);

        if (numAmount < 1200) return 1;
        if (numAmount >= 1200 && numAmount < 2000) return 2;
        if (numAmount >= 2000 && numAmount < 3000) return 3;
        return 4;
    };

    // Handle preset budget selection
    const handlePresetSelect = (priceLevel) => {
        onChange(priceLevel);
    };

    // Handle custom budget input
    const handleCustomBudgetChange = (e) => {
        // Allow only numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomBudget(value);
    };

    // Handle apply button click
    const handleApplyCustomBudget = () => {
        const amount = parseInt(customBudget, 10);
        if (!isNaN(amount)) {
            const priceLevel = getPriceLevelFromAmount(amount);
            if (priceLevel !== null) {
                onChange(priceLevel);
            }
        }
    };

    // Get budget category name based on custom amount
    const getBudgetCategory = () => {
        if (!customBudget || isNaN(parseInt(customBudget, 10))) return null;

        const priceLevel = getPriceLevelFromAmount(parseInt(customBudget, 10));
        if (priceLevel === null) return null;

        return priceRanges.hotels[priceLevel]?.label || null;
    };

    // Get price range text based on custom amount
    const getPriceRangeText = () => {
        if (!customBudget || isNaN(parseInt(customBudget, 10))) return null;

        const priceLevel = getPriceLevelFromAmount(parseInt(customBudget, 10));
        if (priceLevel === null) return null;

        return priceRanges.hotels[priceLevel]?.range || null;
    };

    // Format for display
    const formatForDisplay = (amount) => {
        return new Intl.NumberFormat('en-EG').format(amount);
    };

    // Calculate the budget category and range for display
    const budgetCategory = getBudgetCategory();
    const priceRangeText = getPriceRangeText();

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <h3 style={{
                    fontSize: '1.1rem',
                    margin: '0',
                    fontWeight: '600',
                    color: '#333'
                }}>Budget Range (per night)</h3>

                {/* Switch between preset and custom */}
                {activeTab === 'custom' && (
                    <button
                        onClick={() => setActiveTab('preset')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#e9f0ff',
                            color: '#0066cc',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>↺</span>
                        Return to preset budgets
                    </button>
                )}
            </div>

            {activeTab === 'preset' ? (
                /* CARD STYLE DESIGN: Horizontal cards for budget options */
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '20px'
                }}>
                    {Object.entries(priceRanges.hotels).map(([level, { label, range }]) => {
                        const isSelected = value === parseInt(level, 10);
                        const primaryColor = '#0066cc'; // Blue color for selected cards

                        return (
                            <div
                                key={level}
                                onClick={() => handlePresetSelect(parseInt(level, 10))}
                                style={{
                                    flex: '1',
                                    minWidth: '120px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '16px 10px',
                                    backgroundColor: isSelected ? primaryColor : 'white',
                                    color: isSelected ? 'white' : '#333',
                                    border: `1px solid ${isSelected ? primaryColor : '#e0e0e0'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center',
                                    boxShadow: isSelected ? '0 2px 8px rgba(0,102,204,0.2)' : 'none'
                                }}
                            >
                                <div style={{
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    marginBottom: '4px'
                                }}>
                                    {label}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: isSelected ? 'rgba(255,255,255,0.9)' : '#666',
                                    lineHeight: '1.3'
                                }}>
                                    {range}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Custom budget entry form */
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                        color: '#444'
                    }}>
                        Enter your budget per night in EGP:
                    </label>

                    {/* Fixed input container with proper spacing */}
                    <div style={{
                        position: 'relative',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        {/* Input field with properly positioned EGP label */}
                        <div style={{
                            position: 'relative',
                            flexGrow: 1
                        }}>
                            <input
                                type="text"
                                value={customBudget}
                                onChange={handleCustomBudgetChange}
                                style={{
                                    width: '40%',
                                    padding: '12px',
                                    fontSize: '16px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    paddingRight: '50px' // Space for EGP label
                                }}
                                placeholder="Amount"
                            />
                            <span style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#666'
                            }}>

                            </span>
                        </div>

                        {/* Apply button - separated to avoid overlap */}
                        <button
                            onClick={handleApplyCustomBudget}
                            style={{
                                backgroundColor: '#0066cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0 20px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                flexShrink: 0,
                                height: '44px' // Match input height
                            }}
                        >
                            Apply
                        </button>
                    </div>

                    {/* Show current budget category if available */}
                    {customBudget && !isNaN(parseInt(customBudget, 10)) && budgetCategory && (
                        <div style={{
                            backgroundColor: '#f0f8ff',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ color: '#0066cc', fontSize: '18px' }}>✓</span>
                            <div>
                                <p style={{ margin: '0', fontWeight: '500' }}>
                                    {formatForDisplay(customBudget)} EGP per night is currently applied
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#555' }}>
                                    This falls under <strong>{budgetCategory}</strong> ({priceRangeText})
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Show price ranges for reference */}
                    <div>
                        <p style={{
                            fontWeight: '500',
                            color: '#444',
                            margin: '16px 0 8px 0'
                        }}>
                            Price ranges for hotels (per night):
                        </p>
                        <ul style={{
                            margin: '0',
                            paddingLeft: '20px',
                            color: '#555'
                        }}>
                            {Object.entries(priceRanges.hotels).map(([level, { label, range }]) => (
                                <li key={level} style={{ marginBottom: '6px' }}>
                                    <strong>{label}:</strong> {range}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Option to switch to custom budget entry (only shown in preset mode) */}
            {activeTab === 'preset' && (
                <button
                    onClick={() => setActiveTab('custom')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px dashed #ccc',
                        borderRadius: '8px',
                        color: '#555',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ fontSize: '14px' }}>+ Enter custom budget</span>
                </button>
            )}
        </div>
    );
};

export default BudgetFilter;