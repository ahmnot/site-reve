export function vigenereEncode(plaintext, keyword = "pluie") {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let encoded = '';

  for (let i = 0, j = 0; i < plaintext.length; i++) {
    const currentLetter = plaintext[i].toUpperCase();

    if (alphabet.includes(currentLetter)) {
      const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
      const letterIndex = (alphabet.indexOf(currentLetter) + shift) % 26;
      encoded += alphabet[letterIndex];
      j++;
    } else {
      encoded += currentLetter; // Preserve non-alphabetic characters
    }
  }
  return encoded;
}

function vigenereDecode(ciphertext, keyword) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let decoded = '';

  for (let i = 0, j = 0; i < ciphertext.length; i++) {
    const currentLetter = ciphertext[i].toUpperCase();

    if (alphabet.includes(currentLetter)) {
      const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
      const letterIndex = (alphabet.indexOf(currentLetter) - shift + 26) % 26;
      decoded += alphabet[letterIndex];
      j++;
    } else {
      decoded += currentLetter;
    }
  }
  return decoded;
}

// Example usage
const keyword = "pluie";
const originalText = "HELLO";
const encodedText = vigenereEncode(originalText, keyword);
const decodedText = vigenereDecode(encodedText, keyword);


// Function to randomly choose three consecutive letters, or four with low probability
export function getRandomThreeOrFourLetters(textArray) {
  const length = textArray.length;
  const probability = Math.random();
  let selectedLetters = [];

  if (probability < 0.1 && length > 3) {
    // 10% chance to show 4 letters
    const startIndex = Math.floor(Math.random() * (length - 3));
    selectedLetters = [
      textArray[startIndex], 
      textArray[startIndex + 1], 
      textArray[startIndex + 2], 
      textArray[startIndex + 3]
    ];
  } else if (length > 2) {
    // 90% chance to show 3 letters
    const startIndex = Math.floor(Math.random() * (length - 2));
    selectedLetters = [
      textArray[startIndex], 
      textArray[startIndex + 1], 
      textArray[startIndex + 2]
    ];
  } else {
    // Fallback if array is too short
    selectedLetters = textArray.slice(0, Math.min(3, length));
  }

  return selectedLetters;
}


export function addSpacesBetweenLetters(lettersArray) {
  // Join the array of letters with a space
  return lettersArray.join(" ");
}
