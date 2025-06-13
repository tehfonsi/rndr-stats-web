import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { sha256 } from 'js-sha256'; // This is an npm package
import { getPasswords, updateName } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .post.js to POST requests.

  try {
    let { node_id, name, password } = await readBody(event);

    // Ensure password from body is hashed for comparison
    const hashedPasswordFromBody = sha256(password);

    let savedPasswords;
    try {
      // getPasswords should return an array of objects like [{ password: 'hash1' }, { password: 'hash2' }]
      const passwordRows = await getPasswords(node_id);
      savedPasswords = passwordRows.map((row) => row.password);
    } catch (dbError) {
      console.error('Error fetching passwords:', dbError);
      setResponseStatus(event, 500);
      return { error: 'Database error while fetching passwords' };
    }

    // Check if the provided hashed password matches any of the saved valid passwords
    const isCorrectPassword = savedPasswords.some((savedPass) => savedPass && savedPass === hashedPasswordFromBody);

    if (!isCorrectPassword) {
      await new Promise(r => setTimeout(r, 1000)); // Delay for security
      console.warn(`Wrong password attempt for node_id: ${node_id}`);
      setResponseStatus(event, 403); // Forbidden
      return { error: 'Password does not match' };
    }

    // Proceed to update the name if password is correct
    try {
      await updateName(node_id, name);
      setResponseStatus(event, 200);
      return { success: true, message: 'Node name updated successfully.' };
    } catch (updateError) {
      console.error('Error updating node name:', updateError);
      setResponseStatus(event, 500);
      return { error: 'Failed to update node name' };
    }

  } catch (error) {
    // Catch errors from readBody or other unexpected issues
    console.error('Outer error in node-name.post.js:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
