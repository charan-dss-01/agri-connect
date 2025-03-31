import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from "js-cookie";
import { useParams } from 'react-router-dom';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [profile, setProfile] = useState();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [cart, setCart] = useState([]);
    const [error, setError] = useState();
    // useEffect(() => {
    //     // Check if profile is loaded
    //     if (profile) {
    //         console.log("Profile loaded:", profile);
    //         fetchCart(); // Call fetchCart here if profile is valid
    //     } else {
    //         console.log("Profile not loaded yet.");
    //     }
    // }, [profile]);
   
    // Initial fetch of user's cart and products
    useEffect(() => {
        const fetchProfile = async () => {
            const token = Cookies.get("jwt");
            if (token) {
                try {
                    const { data } = await axios.get("http://localhost:3000/api/users/my-profile", {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization':` Bearer ${token}`,
                        },
                    });
                    setProfile(data);
                    setIsAuthenticated(true);
                    console.log("Profile Data:", data);
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            } else {
                console.log("Token not found");
            }
        };

        const fetchProducts = async () => {
            try {
                const { data } = await axios.get("http://localhost:3000/api/products/all-products");
                setProducts(data);
                console.log("Products fetched:", data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        fetchProfile();
        fetchProducts();
        //fetchCart(); // Fetch the cart when the provider mounts
    }, []);
    
    const addToCart = async (product) => {
        const token = Cookies.get("jwt");
        const userId = profile?._id;
    
        if (!product?._id || !userId) {
            console.error("Product ID or User ID is missing.");
            return;
        }
    
        try {
            // Optimistically update local cart state
            setCart(prevCart => {
                const existingProduct = prevCart.find(item => item._id === product._id);
                if (existingProduct) {
                    return prevCart.map(item =>
                        item._id === product._id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
                return [...prevCart, { ...product, quantity: 1 }];
            });
    
            // Send POST request to add to cart
            const response = await axios.post(
                `http://localhost:3000/api/users/cart/add/${product._id}`,
                { userId, product },
                { withCredentials: true, headers: { 'Authorization': `Bearer ${token}` } }
            );
    
            console.log("Product added to cart:", response.data);
        } catch (error) {
            // Revert optimistic update if there's an error
            setCart(prevCart => prevCart.filter(item => item._id !== product._id));
    
            console.error("Error adding product to cart:", error);
        }
    };
    

    const removeFromCart = async (product) => {
        const userId = profile?._id;
        const token = Cookies.get("jwt");
    
        // Check if userId and product are defined
        if (!userId || !product || !product._id) {
            console.error("User ID or Product information is missing.");
            setError("User ID or Product information is missing.");
            return;
        }
    
        try {
            // Make a DELETE request to remove the product from the cart
            const response = await axios.delete(
                `http://localhost:3000/api/users/cart/remove/${product.product._id}`, // Ensure product._id exists
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    data: {
                        userId, 
                        product,
                    },
                    withCredentials: true, 
                }
            );
    
 
            console.log("Product removed from cart:", response.data);
    
          
            await fetchCart(); 
    
        } catch (error) {
            setError(error.response?.data?.message || 'Error removing product from cart');
            console.error("Error removing product from cart:", product.product._id);
        }
    };
    
    const fetchCart = async (id) => {
        const token = Cookies.get("jwt");
        const userId = profile?._id||profile?.user._id||id;
    
        // Log userId and token for debugging
        console.log("User ID:", userId);
        console.log("Token:", token);
        // console.log(profile?._id);
        // console.log(profile);
        // console.log(profile?.user?._id);
        // console.log(id);
        
        // Check if userId is available
        if (!userId) {
            console.error("User ID is missing.",userId,profile);
            setError("User ID is missing.");
            return;
        }
    
        // Check if the token is available
        if (!token) {
            console.error("User not authenticated. Unable to fetch cart.");
            setError("User not authenticated.");
            return;
        }
    
        try {
            // Make a GET request to fetch the user's cart with userId as a query parameter
            const response = await axios.get(
                `http://localhost:3000/api/users/cart?userId=${userId}`, // Use query parameter
                {
                    withCredentials: true, // To send cookies with the request
                    headers: {
                        'Content-Type': 'application/json', // Set content type to JSON
                        'Authorization': `Bearer ${token}`, // Send JWT token in Authorization header
                    },
                }
            );
    
            // Set the fetched cart to state
            setCart(response.data.cart); // Adjust based on your API response structure
            console.log("Cart fetched:", response.data.cart);

            
        } catch (error) {
            // Handle errors and set error state
            const errorMessage = error.response?.data?.message || 'Error fetching cart';
            setError(errorMessage);
            console.error("Error fetching cart:", error.response || error);
        }
    };

    // Function to clear the cart
    const clearCart = async () => {
        const token = Cookies.get("jwt");
        const userId = profile?._id; // Use optional chaining to avoid undefined errors
    
        if (!token) {
            console.error("No token provided.");
            setError("No token provided.");
            return;
        }
    
        if (!userId) {
            console.error("User ID is missing.");
            setError("User ID is missing.");
            return;
        }
    
        try {
            const response = await axios.delete('http://localhost:3000/api/users/cart/clear', {
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                    'Authorization': `Bearer ${token}`, // Send JWT token in Authorization header
                },
                data: {
                    userId, // Send userId in the request body
                },
                withCredentials: true, // To send cookies with the request
            });
    
            setCart(response.data.cart); // Clear local cart state
            console.log("Cart cleared:", response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error clearing cart');
            console.error("Error clearing cart:", error);
        }
    };
    


    return (
        <AuthContext.Provider value={{ 
            products, 
            profile, 
            setProfile, 
            isAuthenticated, 
            setIsAuthenticated, 
            cart, 
            addToCart, 
            removeFromCart, 
            fetchCart, 
            clearCart 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};