import { verifyKey } from 'discord-interactions';

/**
 * Verify the request signature from Discord.
 * @param {Request} request - The incoming request.
 * @param {object} env - The environment variables.
 * @returns {Promise<{isValid: boolean, interaction?: object}>}
 */
export async function verifyDiscordRequest(request, env) {
  console.log('Starting request verification...');
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');

  console.log('Request headers:', {
    'x-signature-ed25519': signature ? 'present' : 'missing',
    'x-signature-timestamp': timestamp ? 'present' : 'missing',
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent')
  });

  const body = await request.text();
  console.log('Request body:', body.substring(0, 1000)); // Log first 1000 chars of body

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    console.error('Missing verification components:', {
      signature: !!signature,
      timestamp: !!timestamp,
      publicKey: !!env.DISCORD_PUBLIC_KEY,
      bodyLength: body.length
    });
    return { isValid: false };
  }

  try {
    console.log('Attempting to verify key with:', {
      bodyLength: body.length,
      signatureLength: signature?.length,
      timestampLength: timestamp?.length,
      publicKeyLength: env.DISCORD_PUBLIC_KEY?.length
    });

    const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    console.log('Key verification result:', isValidRequest);

    if (!isValidRequest) {
      console.error('Invalid request signature');
      return { isValid: false };
    }

    const parsedBody = JSON.parse(body);
    console.log('Successfully parsed interaction:', {
      type: parsedBody.type,
      commandName: parsedBody.data?.name,
      options: parsedBody.data?.options
    });

    return {
      interaction: parsedBody,
      isValid: true,
    };
  } catch (err) {
    console.error('Verification error:', err);
    console.error('Error stack:', err.stack);
    return { isValid: false };
  }
}