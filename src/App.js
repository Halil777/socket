import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { appSocket, onlineSocket } from "./api-interface/socket-io/socket.mjs";
import AcceptCall from "./layout/accept-call/AcceptCall";
import Courier from "./layout/courier/Courier";
import Customer from "./layout/customer/Customer";
import Home from "./layout/homepage/Home";
import Inbox from "./layout/inbox/Inbox";
import LoginPage from "./layout/login/LoginPage";
import MissedCall from "./layout/missed-call/MissedCall";
import Order from "./layout/order/Order";
import RinginCall from "./layout/ringin-call/RinginCall";
import Sidebar from "./Sidebar";
import { showError, showSuccess } from "./view/Alert/Alert.jsx";
import useNetwork from "./hooks/useNetwork";
import { createTheme, ThemeProvider } from "@mui/material";
import { AxiosInstance, LocalAxiosInstance } from "./api-interface/api/AxiosInstance.mjs";
import {onMessageListener, requestForToken} from "./fcm/firebase";

export const AppContext = createContext();

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5d9cce',
      light: '#90cdff',
      lighter: '#d5e4ed',
      dark: '#246e9d',
      darker: '#a4b2bb'
    },
    secondary: {
      main: '#d5e4ed',
      light: '#ffffff',
      lighter: '#ffffff',
      dark: '#a4b2bb',
      darker: '#a4b2bb'
    },
    info: {
      main: '#1890FF',
      light: '#74CAFF',
      lighter: '#D0F2FF',
      dark: '#0C53B7',
      darker: '#04297A'
    },
    success: {
      main: '#54D62C',
      light: '#AAF27F',
      lighter: '#E9FCD4',
      dark: '#229A16',
      darker: '#08660D'
    },
    warning: {
      main: '#FFC107',
      light: '#FFE16A',
      lighter: '#FFF7CD',
      dark: '#B78103',
      darker: '#7A4F01'
    },
    error: {
      main: '#FF4842',
      light: '#FFA48D',
      lighter: '#FFE7D9',
      dark: '#B72136',
      darker: '#7A0C2E'
    },
    grey: {
      "100": "#F9FAFB",
      "200": "#F4F6F8",
      "300": "#DFE3E8",
      "400": "#C4CDD5",
      "500": "#919EAB",
      "600": "#637381",
      "700": "#454F5B",
      "800": "#212B36",
      "900": "#161C24",
    }
  },
});

function App() {
  // console.log = () => {};
  // console.error = () => {};
  // console.warning = () => {};
  // console.warn = () => {};
  // console.info = () => {};
  const [calls, setCalls] = useState([]);
  const [fields, setFileds] = useState([]);
  const [permissions,setPermissions]=useState([]);

  const callChecker = (call) => {
    return calls.filter((item, i) => item.call.uniqueId !== call.call.uniqueId);
  }



  const [unreadCount, setUnreadCount] = useState(0);
  appSocket.on("onCall", (arg, callback) => {
    if (localStorage.getItem('unique_id') == arg.operator.unique_id) {
      let checked = callChecker(arg);

      let newArray = [
        arg,
        ...checked
      ]
      setCalls(newArray);

      try {
        showSuccess(`${arg.call.callStateStr}, ${arg.call.callTypeStr} : ${arg.call.phNumber}, ${arg.customer[0].fullname}`)
      } catch (err) {
        // showSuccess(`${arg.call.callStateStr}, ${arg.call.callTypeStr} : ${arg.call.phNumber}`)
      }
    }
  });

  // useEffect(() => {
  //   window.addEventListener('beforeunload', alertUser)
  //   window.addEventListener('unload', handleTabClosing)
  //   return () => {
  //     window.removeEventListener('beforeunload', alertUser)
  //     window.removeEventListener('unload', handleTabClosing)
  //   }
  // })
  //
  // const handleTabClosing = () => {
  //   alert('Clossing');
  // }
  //
  // const alertUser = (event:any) => {
  //   event.preventDefault()
  //   let axios=online?AxiosInstance:LocalAxiosInstance;
  //   axios.post('/operator/auth-v2/log-out')
  //       .then(result=>{})
  //       .catch(err=>{});
  //   return event.returnValue = 'Çyndanam çykmak isleýärsiňizmi?'
  // }

  onlineSocket.on("onInbox", (arg, callback) => {
    if (arg.unique_id == localStorage.getItem('unique_id')) {
      showSuccess(`Täze hat geldi!`)
    }
  });

  // const networkState = useNetwork();
  // const { online, since } = useNetwork();
  const [online,setOnline]=useState(true);

  const [allCustomer, setAllCustomer] = useState([]);
  const [couriers, setCouriers] = useState([]);

  const customers = () => {
    let axios=online?AxiosInstance:LocalAxiosInstance;
    axios.get("operator/get-all-customer")
      .then((response) => {
        setAllCustomer(response.data.body);
      })
      .catch((err) => {
        showError(err + "");
      });
  };

  const getCouriers = () => {
    let axios=online?AxiosInstance:LocalAxiosInstance;
    axios.get("/operator/get-couriers")
      .then((response) => {
        setCouriers(response.data.body);
      })
      .catch((err) => {
        showError(err + "");
      });
  };

  const getFields = async () => {
    let axios=online?AxiosInstance:LocalAxiosInstance;
    axios.get("/operator/get-fields")
      .then((response) => {
        setFileds(response.data.body);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getPermissions=()=>{
    const data = {
      username: localStorage.getItem('username'),
      password: localStorage.getItem('password'),
    };
    let axios=online?AxiosInstance:LocalAxiosInstance;
    axios.post("/operator/auth/sign-in", data)
        .then((response) => {
          // setIsLoading(false);
          if (!response.data.error) {
            setPermissions(response.data.body.user_permissions);
          } else {
            showError("Username or password is incorrect!");
          }
        })
        .catch((err) => {
        });
  }

  const fcm=()=>{
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        // navigator.serviceWorker.register("/flutter_service_worker.js");
        navigator.serviceWorker.register("/firebase-messaging-sw.js");
      });
    }
    requestForToken();

    onMessageListener()
        .then((payload) => {
          showSuccess(`${payload?.notification?.title} / ${payload?.notification?.body}`);
        })
        .catch((err) => console.log('failed: ', err));
  }


  useEffect(() => {
    getPermissions();
    customers();
    getCouriers();
    getFields();
    fcm();
  }, []);


  useEffect(() => {
    getPermissions();
    customers();
    getCouriers();
    getFields();
  }, [online]);



  return (
    <ThemeProvider theme={lightTheme}>
      <AppContext.Provider value={{
        online: online,
        allCustomer: allCustomer,
        couriers: couriers,
        fields: fields,
        permissions:permissions
      }}>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/login" index element={<LoginPage />} />
            <Route path="/" element={<Sidebar unreadCount={unreadCount} setUnreadCount={setUnreadCount} setOnline={setOnline} />}>
              <Route index element={<Home />} />
              <Route path="/accept-call" element={<AcceptCall setCalls={setCalls} calls={calls} />} />
              <Route path="/courier" element={<Courier />} />
              <Route path="/customer" element={<Customer />} />
              <Route path="/inbox" element={<Inbox unreadCount={unreadCount} setUnreadCount={setUnreadCount} />} />
              <Route path="/ringin-call" element={<RinginCall />} />
              <Route path="/order" element={<Order />} />
              <Route path="/missed-call" element={<MissedCall />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppContext.Provider>
    </ThemeProvider>
  );
}

export default App;
