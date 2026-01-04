import Toast from "react-native-toast-message";

const toast = {
  success: (text) => Toast.show({ type: "success", text1: text }),
  error: (text) => Toast.show({ type: "error", text1: text }),
};

export default toast;
