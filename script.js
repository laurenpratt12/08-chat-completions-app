// Get references to the DOM elements
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const responseContainer = document.getElementById('response');

// Keep track of the conversation so far, starting with the system message
const conversationHistory = [
  { role: 'system', content: `You are a friendly Budget Travel Planner, specializing in cost-conscious travel advice. You help users find cheap flights, budget-friendly accommodations, affordable itineraries, and low-cost activities in their chosen destination. If a user's query is unrelated to budget travel, respond by stating that you do not know.` }
];

// Listen for form submission instead of running once on page load
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // Stop the page from reloading

  const question = userInput.value.trim();
  if (!question) return; // Ignore empty submissions

  userInput.value = ''; // Clear the input field right away

  // Add the user's message to the conversation history
  conversationHistory.push({ role: 'user', content: question });
  console.log('Sending conversation history:', conversationHistory); // Debug: confirm history is accumulating

  responseContainer.textContent = 'Thinking...'; // Simple loading state

  try {
    // Send a POST request to the OpenAI API, including the full conversation so far
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationHistory, // Send the whole history, not just the latest message
        max_completion_tokens: 800, // Limit the response length to avoid excessive token usage
        temperature: 0.5, // Adjust for creativity; lower is more deterministic
        frequency_penalty: 0.8, // Discourage repetitive responses
      })
    });

    if (!response.ok) {
      // Try to pull the actual error message from OpenAI's response body
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const reply = result.choices[0].message.content;

    // Add the assistant's reply to the conversation history so future requests have context
    conversationHistory.push({ role: 'assistant', content: reply });

    // Display the reply on the page, preserving line breaks (see #response CSS: white-space: pre-wrap)
    responseContainer.textContent = reply;
  } catch (error) {
    // Show the real error on the page so we can see what's actually wrong
    responseContainer.textContent = `Error: ${error.message}`;
    console.error('Full error:', error);

    // Roll back the user's message since it didn't get a successful response
    conversationHistory.pop();
  }
});