import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import CatalogPage from "./pages/catalog/CatalogPage";
import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/custom-studio" element={<CustomStudioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;