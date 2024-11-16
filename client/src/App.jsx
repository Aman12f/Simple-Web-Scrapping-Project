import React, { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [n, setN] = useState(10); // Default value of 10
  const [words, setWords] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setWords([]);

    try {
      const response = await axios.post("http://localhost:5000/analyze", { url, n });
      setWords(response.data);
    } catch (err) {
      setError("Failed to fetch or process the URL.");
    }
  };


  return (
    <>
    <div className="d-flex justify-content-center min-vh-100" style={{ background: "#EEEEF4",width:"272%",fontFamily: "'Poppins', sans-serif" }}>
  <div className="container my-5 d-flex flex-column align-items-center p-4" style={{ width: "50%", borderRadius:"16px" , background:"white" }}>
    <h2 className="text-center mb-4">Word Frequency Calculator</h2>

    <form onSubmit={handleSubmit} className="w-100">
      <div className="d-flex gap-2 mb-3 justify-content-center">
        <div className="col-8">
          <input
            type="text"
            className="form-control"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="col-3">
          <input
            type="number"
            className="form-control"
            placeholder="Top N"
            value={n}
            onChange={(e) => setN(e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex justify-content-center">
        <button type="submit" className="btn" style={{background:"#5F00D9", color:"#FFFFFF"}}>Analyze</button>
      </div>
    </form>

    {error && <p className="text-danger text-center mt-3">{error}</p>}

    {words.length > 0 && (
      <table className="table table-bordered table-hover mt-4 w-100" style={{borderRadius:"16px"}}>
        <thead className="table-dark">
          <tr>
            <th className="text-center">Word</th>
            <th className="text-center">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {words.map((item, index) => (
            <tr key={index} className="table-row" style={{ cursor: "pointer" }}>
              <td className="text-center">{item.word}</td>
              <td className="text-center">{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</div>


    </>
  );
}

export default App;
