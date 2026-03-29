import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import authService from "../../api/authService";
import { Colors } from "../../constants/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const { isLoading } = useSelector((state: any) => state.auth);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Vendor Media Upload Fields
  const [userImg, setUserImg] = useState<any>(null);
  const [userIdDoc, setUserIdDoc] = useState<any>(null);
  const [shopDocument, setShopDocument] = useState<any>(null);
  const [shopImg, setShopImg] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    let newErrors: Record<string, string> = {};

    // Core User Info Validations
    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Minimum 3 characters required";
    } else if (!/^[a-zA-Z0-9 ]+$/.test(username)) {
      newErrors.username = "Only letters and numbers allowed";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    } 
    // [else if (
    //   !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)
    // ) {
    //   newErrors.password =
    //     "Must include uppercase, lowercase, number & special character";
    // }]

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Media & Document Validations
    if (!userImg) newErrors.userImg = "User Image is required";
    if (!userIdDoc) newErrors.userIdDoc = "User ID Document is required";
    if (!shopDocument) newErrors.shopDocument = "Shop Document is required";
    if (!shopImg) newErrors.shopImg = "Shop Image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (setter: React.Dispatch<React.SetStateAction<any>>) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0]);
  };

  const pickDocument = async (setter: React.Dispatch<React.SetStateAction<any>>) => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setter(result.assets[0]);
  };

  const handleRegister = async () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fill all required fields appropriately.");
      return;
    }

    try {
      /**
       * Note: If you have an endpoint that accepts FormData, you can utilize the `authService.signupForm` here.
       * Since we need to transition to OTP BEFORE logging them in, we bypass the direct Redux auth dispatch for now
       * or dispatch an action that only registers but does not grant a token.
       * 
       * Example Form payload mapping:
       * const formData = new FormData()
       * formData.append("username", username) ...
       */

      // Assuming API sent OTP to email, navigate to the newly created OTP verification screen.
      router.push({ pathname: "/(auth)/otp-verification", params: { email } });

    } catch (error: any) {
      Alert.alert(
        "Register Failed",
        error?.response?.data?.message || "Something went wrong",
      );
    }
  };

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 40 }}
      >
        <View style={styles.card}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Vendor Registration</Text>

          {/* Account Details */}
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          {errors.username && <Text style={styles.error}>{errors.username}</Text>}

          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          {/* Media / Documents Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Vendor Documents</Text>

            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setUserImg)}>
              <MaterialIcons name="photo-camera" size={20} color={Colors.default.primary} />
              <Text style={styles.uploadBtnText}>
                {userImg ? "User Image Selected ✔" : "Upload User Image"}
              </Text>
            </TouchableOpacity>
            {errors.userImg && <Text style={styles.error}>{errors.userImg}</Text>}

            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument(setUserIdDoc)}>
              <FontAwesome name="id-card-o" size={20} color={Colors.default.primary} />
              <Text style={styles.uploadBtnText}>
                {userIdDoc ? "User ID Document Selected ✔" : "Upload User ID"}
              </Text>
            </TouchableOpacity>
            {errors.userIdDoc && <Text style={styles.error}>{errors.userIdDoc}</Text>}

            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument(setShopDocument)}>
              <MaterialIcons name="description" size={20} color={Colors.default.primary} />
              <Text style={styles.uploadBtnText}>
                {shopDocument ? "Shop Document Selected ✔" : "Upload Shop Document"}
              </Text>
            </TouchableOpacity>
            {errors.shopDocument && <Text style={styles.error}>{errors.shopDocument}</Text>}

            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setShopImg)}>
              <MaterialIcons name="store" size={20} color={Colors.default.primary} />
              <Text style={styles.uploadBtnText}>
                {shopImg ? "Shop Image Selected ✔" : "Upload Shop Image"}
              </Text>
            </TouchableOpacity>
            {errors.shopImg && <Text style={styles.error}>{errors.shopImg}</Text>}
          </View>

          {/* Passwords */}
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}

          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Processing..." : "Register & Get OTP"}
            </Text>
          </TouchableOpacity>

          <View style={styles.linewithtext}>
            <View style={styles.line} />
            <Text style={styles.text}>or</Text>
            <View style={styles.line} />
          </View>
          <Text style={styles.otherSignIn}>Sign in with</Text>
          <View style={styles.otherSignInicon}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: "#3b5998" }]}>
              <FontAwesome name="facebook-f" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: "#ff8c00" }]}>
              <MaterialIcons name="email" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.SignupBtn}>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <AntDesign name="up" size={15} color="white" style={styles.upArrow} />
          <Text style={[styles.signup, { color: "white" }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  card: {
    padding: 25,
    borderRadius: 20,
  },
  logo: {
    width: 200,
    height: 120, // slightly smaller so form fits nicely
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.default.primary,
    marginBottom: 20,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
    marginLeft: 10,
    marginBottom: 5, // added margin bottom to space fields visually
  },
  input: {
    backgroundColor: Colors.default.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 45, // slightly larger touch area
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.default.gray,
  },
  uploadSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.default.primary,
    marginBottom: 10,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.default.white,
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.default.gray,
    marginBottom: 8,
  },
  uploadBtnText: {
    color: "#555",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.default.primary,
    height: 45,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signup: {
    textAlign: "center",
    color: Colors.default.primary,
    fontWeight: "500",
    marginBottom: 7,
  },
  linewithtext: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 20,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.default.primary,
  },
  text: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
  },
  otherSignIn: {
    color: Colors.default.primary,
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
  },
  otherSignInicon: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  iconButton: {
    width: 35,
    height: 35,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  SignupBtn: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.default.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  upArrow: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
});
