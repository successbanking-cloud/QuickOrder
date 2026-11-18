 import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "./supabaseClient";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6fa",
    padding: "25px 15px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  container: {
    maxWidth: "850px",
    margin: "auto",
  },
  card: {
    background: "#fff",
    padding: "25px",
    margin: "20px auto",
    borderRadius: "12px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
  },
  input: {
    width: "100%",
    padding: "13px",
    marginTop: "7px",
    marginBottom: "16px",
    border: "1px solid #d8deea",
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#1769e0",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "8px",
  },
  secondary: {
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid #d8deea",
    borderRadius: "7px",
    cursor: "pointer",
  },
  label: {
    fontWeight: "bold",
    fontSize: "14px",
  },
  message: {
    padding: "13px",
    background: "#eef4ff",
    borderRadius: "7px",
    marginTop: "15px",
    fontSize: "14px",
  },
};

function Header() {
  return (
    <div style={{ marginBottom: "25px" }}>
      <h1 style={{ color: "#1769e0", marginBottom: "5px" }}>
        QUICKORDER
      </h1>
      <p style={{ color: "#667085", marginTop: 0 }}>
        Smart ordering for modern businesses.
      </p>
    </div>
  );
}

// CUSTOMER ORDERING PAGE

function CustomerPage({ slug }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [items, setItems] = useState([
    { name: "", quantity: 1 },
  ]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function findBusiness() {
      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (businessError) {
        setError(businessError.message);
      } else if (!data) {
        setError("This business ordering page could not be found.");
      } else {
        setBusiness(data);
      }

      setLoading(false);
    }

    findBusiness();
  }, [slug]);

  function updateItem(index, field, value) {
    setItems((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((previous) => [
      ...previous,
      { name: "", quantity: 1 },
    ]);
  }

  function removeItem(index) {
    setItems((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  async function submitOrder(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanItems = items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
      }));

    if (!customerName.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    if (cleanItems.length === 0) {
      setError("Please enter at least one item.");
      return;
    }

    if (
      cleanItems.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setError("Item quantities must be whole numbers of at least 1.");
      return;
    }

    setWorking(true);

    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        business_id: business.id,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        items: cleanItems,
        instructions: instructions.trim(),
      });

    setWorking(false);

    if (orderError) {
      setError(orderError.message);
      return;
    }

    setMessage(
      "Your order has been submitted successfully! The business will contact you about your order."
    );

    setCustomerName("");
    setPhone("");
    setInstructions("");
    setItems([{ name: "", quantity: 1 }]);
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Header />
          <div style={styles.card}>Loading business...</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Header />
          <div style={styles.card}>
            <h2>Business not found</h2>
            <p>{error || "This ordering link is not available."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header />

        <div style={styles.card}>
          <h2>{business.name}</h2>
          <p style={{ color: "#667085" }}>
            Place your order below. Enter the items you would like
            to order and their quantities.
          </p>

          {error && (
            <div
              style={{
                ...styles.message,
                background: "#fff0f0",
                color: "#b42318",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <form onSubmit={submitOrder}>
            <label style={styles.label}>Your full name</label>
            <input
              style={styles.input}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required
            />

            <label style={styles.label}>Phone number</label>
            <input
              style={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />

            <h3>Your items</h3>

            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e4e7ec",
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                }}
              >
                <label style={styles.label}>
                  Item {index + 1}
                </label>

                <input
                  style={styles.input}
                  value={item.name}
                  onChange={(e) =>
                    updateItem(index, "name", e.target.value)
                  }
                  placeholder="Example: Fried rice"
                  required
                />

                <label style={styles.label}>Quantity</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  required
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    style={styles.secondary}
                    onClick={() => removeItem(index)}
                  >
                    Remove item
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              style={styles.secondary}
              onClick={addItem}
            >
              + Add another item
            </button>

            <div style={{ marginTop: "22px" }}>
              <label style={styles.label}>
                Additional instructions (optional)
              </label>

              <textarea
                style={{
                  ...styles.input,
                  minHeight: "90px",
                  resize: "vertical",
                }}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any special requests?"
              />
            </div>

            <button
              type="submit"
              style={styles.button}
              disabled={working}
            >
              {working ? "Submitting order..." : "Submit Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// OWNER LOGIN AND DASHBOARD

function OwnerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [business, setBusiness] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [orders, setOrders] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOrders(businessId) {
    const { data, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (orderError) {
      setError(orderError.message);
      return;
    }

    setOrders(data || []);
  }

  async function loadOwnerData(userId) {
    const { data: membership, error: membershipError } =
      await supabase
        .from("business_members")
        .select("business_id, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    if (membershipError) {
      setError(membershipError.message);
      return;
    }

    if (!membership) {
      setBusiness(null);
      setOrders([]);
      return;
    }

    const { data: businessData, error: businessError } =
      await supabase
        .from("businesses")
        .select("*")
        .eq("id", membership.business_id)
        .maybeSingle();

    if (businessError) {
      setError(businessError.message);
      return;
    }

    if (!businessData) {
      setBusiness(null);
      return;
    }

    setBusiness(businessData);
    await loadOrders(businessData.id);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentUser = data.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await loadOwnerData(currentUser.id);
      }

      if (mounted) setLoading(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        loadOwnerData(currentUser.id);
      } else {
        setBusiness(null);
        setOrders([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // REAL-TIME ORDER UPDATES

  useEffect(() => {
    if (!business?.id) return;

    const businessId = business.id;

    const channel = supabase
      .channel(`orders-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const newOrder = payload.new;

          setOrders((previousOrders) => {
            const alreadyExists = previousOrders.some(
              (order) => order.id === newOrder.id
            );

            if (alreadyExists) return previousOrders;

            return [newOrder, ...previousOrders];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const updatedOrder = payload.new;

          setOrders((previousOrders) =>
            previousOrders.map((order) =>
              order.id === updatedOrder.id
                ? updatedOrder
                : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id]);

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setWorking(true);

    try {
      if (mode === "signup") {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

        if (authError) throw authError;

        if (!data.session) {
          setMessage(
            "Registration successful! Check your email and confirm your account. Then return here and log in."
          );
        } else {
          setMessage("Account created successfully!");
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;

        setMessage("Login successful!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleBusinessRegistration(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setWorking(true);

    try {
      const cleanName = businessName.trim();

      if (cleanName.length < 2) {
        throw new Error("Please enter a valid business name.");
      }

      const baseSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const slug =
        `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const { error: registrationError } =
        await supabase.rpc("create_business", {
          p_name: cleanName,
          p_slug: slug,
        });

      if (registrationError) throw registrationError;

      setMessage("Your business has been registered successfully!");
      setBusinessName("");

      await loadOwnerData(user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    if (!business) return;

    setError("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .eq("business_id", business.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadOrders(business.id);
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) setError(logoutError.message);
  }

  function downloadQRCode() {
    const svg = document.getElementById("quickorder-business-qr");

    if (!svg) {
      setError("QR code could not be found. Please refresh the page.");
      return;
    }

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const svgBlob = new Blob(
      [svgData],
      { type: "image/svg+xml;charset=utf-8" }
    );
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;

      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 100, 100, 1000, 1000);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      link.href = pngUrl;
      link.download = `${business.slug}-quickorder-qr.png`;
      link.click();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Unable to download the QR code. Please try again.");
    };

    image.src = url;
  }

  if (loading) {
    return <div style={styles.page}>Loading QUICKORDER...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header />

        {error && (
          <div
            style={{
              ...styles.message,
              background: "#fff0f0",
              color: "#b42318",
            }}
          >
            {error}
          </div>
        )}

        {message && <div style={styles.message}>{message}</div>}

        {!user && (
          <div style={styles.card}>
            <h2>
              {mode === "login"
                ? "Business Owner Login"
                : "Create Your Account"}
            </h2>

            <form onSubmit={handleAuth}>
              <label style={styles.label}>Email address</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                minLength={6}
                required
              />

              <button
                style={styles.button}
                type="submit"
                disabled={working}
              >
                {working
                  ? "Please wait..."
                  : mode === "login"
                    ? "Log In"
                    : "Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "14px" }}>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              {" "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setMessage("");
                }}
                style={{
                  border: "none",
                  background: "none",
                  color: "#1769e0",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {mode === "login" ? "Register" : "Log In"}
              </button>
            </p>
          </div>
        )}

        {user && !business && (
          <div style={styles.card}>
            <h2>Register Your Business</h2>
            <p>Enter the name of your business to get started.</p>

            <form onSubmit={handleBusinessRegistration}>
              <label style={styles.label}>Business name</label>
              <input
                style={styles.input}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                required
              />

              <button
                style={styles.button}
                type="submit"
                disabled={working}
              >
                {working ? "Registering..." : "Register Business"}
              </button>
            </form>

            <button
              style={styles.secondary}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        )}

        {user && business && (
          <>
            <div style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 style={{ marginBottom: "5px" }}>
                    {business.name}
                  </h2>
                  <p style={{ color: "#667085", marginTop: 0 }}>
                    Business Owner Dashboard
                  </p>
                </div>

                <button
                  style={styles.secondary}
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>

              <div
                style={{
                  padding: "18px",
                  background: "#eef4ff",
                  borderRadius: "8px",
                  marginTop: "18px",
                }}
              >
                <h2 style={{ margin: 0 }}>{orders.length}</h2>
                <p style={{ marginBottom: 0 }}>
                  Total orders received
                </p>
              </div>

              <h3>Customer ordering link</h3>
              <p style={{ fontSize: "14px", color: "#667085" }}>
                This is the link customers will use for your business.
              </p>

              <input
                style={styles.input}
                readOnly
                value={`${window.location.origin}/?business=${business.slug}`}
                onFocus={(e) => e.target.select()}
              />

              <button
                style={styles.button}
                onClick={() => loadOrders(business.id)}
              >
                Refresh Orders
              </button>
            </div>

            {/* BUSINESS QR CODE */}

            <div style={styles.card}>
              <h2>Your Business QR Code</h2>

              <p style={{ color: "#667085" }}>
                Customers can scan this QR code to open your
                business ordering page.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "20px",
                  background: "#ffffff",
                }}
              >
                <QRCodeSVG
                  id="quickorder-business-qr"
                  value={`${window.location.origin}/?business=${business.slug}`}
                  size={260}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <h3 style={{ textAlign: "center" }}>
                {business.name}
              </h3>

              <p
                style={{
                  textAlign: "center",
                  color: "#667085",
                  fontSize: "13px",
                }}
              >
                Scan to place your order
              </p>

              <button
                style={styles.button}
                onClick={downloadQRCode}
              >
                Download QR Code
              </button>
            </div>

            <div style={styles.card}>
              <h2>Customer Orders</h2>

              {orders.length === 0 ? (
                <p style={{ color: "#667085" }}>
                  No orders yet. Customer orders will appear here.
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      border: "1px solid #e4e7ec",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    <h3>{order.customer_name}</h3>
                    <p>Phone: {order.phone}</p>

                    <strong>Items:</strong>

                    {Array.isArray(order.items) &&
                      order.items.map((item, index) => (
                        <p key={index}>
                          {item.name} — Quantity: {item.quantity}
                        </p>
                      ))}

                    {order.instructions && (
                      <p>
                        <strong>Instructions:</strong>{" "}
                        {order.instructions}
                      </p>
                    )}

                    <p>
                      <strong>Status:</strong> {order.status}
                    </p>

                    <label style={styles.label}>
                      Update order status
                    </label>

                    <select
                      style={styles.input}
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <small style={{ color: "#667085" }}>
                      Received:{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const businessSlug = params.get("business");

  if (businessSlug) {
    return <CustomerPage slug={businessSlug} />;
  }

  return <OwnerPage />;
}

export default App;