import { createSlice } from "@reduxjs/toolkit";

const weatherSlice = createSlice({
  name: "weather",
  initialState: {
    data: null,
    forecast: null,
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state) => { state.loading = true; },
    setWeather: (state, action) => {
      state.data = action.payload.weather;
      state.forecast = action.payload.forecast;
      state.loading = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setWeather, setError } = weatherSlice.actions;
export default weatherSlice.reducer;