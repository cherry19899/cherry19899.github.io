// Connects.js - Buy Connects
const { useState, useEffect } = React;

function Connects({ user, onUpdateUser }) {
  const [balance, setBalance] = useState(user?.balance_connects || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  const packages = [
    { quantity: 10, price: 1, label: "Starter", popular: false },
    { quantity: 50, price: 4, label: "Pro", popular: true },
    { quantity: 100, price: 7, label: "Business", popular: false },
    { quantity: 500, price: 30, label: "Enterprise", popular: false },
  ];

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    if (!user?.uid) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/connects/balance",
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        const bal = data.balance ?? data.balance_connects ?? 0;
        setBalance(bal);
      }
    } catch (e) {
      /* silent fail */
    }
  };

  const handleBuy = async (quantity, price) => {
    if (!user?.uid) return;

    setPurchasing(quantity);
    setError("");

    try {
      // Initialize Pi SDK for payment
      Pi.init({ version: "2.0", sandbox: true });

      const paymentData = {
        amount: price,
        memo: `Buy ${quantity} WorkPro Connects`,
        metadata: { type: "connects", quantity, user_id: user.uid },
      };

      const payment = await Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId) => {
          // Notify backend of pending payment
          try {
            await fetch(
              "https://workpro-api.onrender.com/api/connects/buy",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": user.uid,
                },
                body: JSON.stringify({
                  quantity,
                  payment_id: paymentId,
                  amount: price,
                  status: "pending",
                }),
              }
            );
          } catch (e) {
            console.error("Approval error:", e);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          // Complete the payment
          try {
            const res = await fetch(
              "https://workpro-api.onrender.com/api/connects/buy",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": user.uid,
                },
                body: JSON.stringify({
                  quantity,
                  payment_id: paymentId,
                  txid,
                  status: "completed",
                }),
              }
            );
            if (res.ok) {
              const data = await res.json();
              const newBalance = data.balance ?? data.balance_connects ?? (balance + quantity);
              setBalance(newBalance);

              // Update stored user
              const stored = JSON.parse(
                localStorage.getItem("workpro_user") || "{}"
              );
              stored.balance_connects = newBalance;
              localStorage.setItem("workpro_user", JSON.stringify(stored));
              onUpdateUser(stored);

              alert(`Successfully purchased ${quantity} connects!`);
            }
          } catch (e) {
            console.error("Completion error:", e);
            setError("Payment processing failed. Contact support.");
          }
        },
        onCancel: () => {
          setPurchasing(false);
          setError("Payment cancelled.");
        },
        onError: (err) => {
          setPurchasing(false);
          setError(`Payment error: ${err.message || "Unknown error"}`);
        },
      });

      console.log("Payment created:", payment);
    } catch (err) {
      console.error("Buy error:", err);
      setError(err.message || "Failed to process payment.");
    } finally {
      setPurchasing(false);
    }
  };

  const fallbackBuy = async (quantity) => {
    // Fallback for sandbox - just call API directly
    if (!user?.uid) return;
    setPurchasing(quantity);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/connects/buy",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ quantity }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Purchase failed");
      }
      const data = await res.json();
      const newBalance = data.balance ?? data.balance_connects ?? (balance + quantity);
      setBalance(newBalance);

      const stored = JSON.parse(localStorage.getItem("workpro_user") || "{}");
      stored.balance_connects = newBalance;
      localStorage.setItem("workpro_user", JSON.stringify(stored));
      onUpdateUser(stored);

      alert(`Purchased ${quantity} connects!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Buy Connects</h1>
      </div>

      <div className="connects-balance-card">
        <div className="balance-display">
          <span className="balance-icon">&#128268;</span>
          <div>
            <span className="balance-number">{balance}</span>
            <span className="balance-label">Available Connects</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <p className="connects-info">
        Connects are used to apply for jobs. Each job application costs the
        number of connects specified in the job listing.
      </p>

      <div className="packages-grid">
        {packages.map((pkg) => (
          <div
            key={pkg.quantity}
            className={`package-card ${pkg.popular ? "popular" : ""}`}
          >
            {pkg.popular && <div className="popular-badge">Most Popular</div>}
            <h3>{pkg.label}</h3>
            <div className="package-quantity">
              {pkg.quantity} <span>connects</span>
            </div>
            <div className="package-price">
              &#120587;{pkg.price} <span>Pi</span>
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={() => fallbackBuy(pkg.quantity)}
              disabled={purchasing === pkg.quantity}
            >
              {purchasing === pkg.quantity ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                "Buy Now"
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="connects-faq">
        <h3>Frequently Asked Questions</h3>
        <details>
          <summary>What are Connects?</summary>
          <p>
            Connects are Work Pro&apos;s internal currency used to apply for jobs.
            Each job application consumes the number of connects specified by the
            client.
          </p>
        </details>
        <details>
          <summary>How do I earn free Connects?</summary>
          <p>
            You receive a small amount of free connects daily. You can also earn
            connects by completing jobs and receiving positive reviews.
          </p>
        </details>
        <details>
          <summary>Do Connects expire?</summary>
          <p>
            No, purchased connects never expire. Free connects may reset monthly.
          </p>
        </details>
        <details>
          <summary>Can I get a refund?</summary>
          <p>
            Connect purchases are non-refundable. Please plan your usage
            accordingly.
          </p>
        </details>
      </div>
    </div>
  );
}
