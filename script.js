
const CUSTOMER_CARE_NUMBER = "14545454";
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzuzQWPc85A9RSJ3mdtYj7NGym8rCOjunMGAMluVEf9k4hssAGrVxwfXG4d1RzYcLoE/exec";

// Combine datasets
const FULL_DATASET = [...GENERAL_QA_DATASET, ...PROP_FIRM_QA_DATASET];

// Format dataset for the AI context
const KNOWLEDGE_BASE_TEXT = FULL_DATASET.map(item => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

let state = {
    turn_count: 0,
    last_intent: null,
    satisfaction_asked: false,
    dissatisfaction_count: 0,
    conversation_ended: false,
    message_count: 0,
    user_verified: false,
    pending_first_message: null,
    attached_files: [],
    user_email: null,
    user_phone: null
};

const chatMessages = document.querySelector('.chat-messages');
const homeTab = document.getElementById('home-tab');
const messagesTab = document.getElementById('messages-tab');
const chatInput = document.querySelector('.input-wrapper input[type="text"]');
const sendBtn = document.querySelector('.send-btn');
const statusText = document.querySelector('.status-text');

// Switch to Messages tab
window.switchToMessages = function() {
    homeTab.style.display = 'none';
    messagesTab.style.display = 'flex';
    messagesTab.style.flexDirection = 'column';
    messagesTab.style.gap = '16px';
    messagesTab.style.padding = '20px';
    document.getElementById('help-tab').style.display = 'none';
    document.getElementById('chat-input-area').style.display = 'flex';
    
    document.querySelectorAll('.chat-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="messages"]').classList.add('active');
    
    if (messagesTab.children.length === 0) {
        showWelcomeMessage();
    }
};

// Switch to Help tab
window.switchToHelp = function() {
    homeTab.style.display = 'none';
    messagesTab.style.display = 'none';
    document.getElementById('help-tab').style.display = 'block';
    document.getElementById('chat-input-area').style.display = 'none';
    
    document.querySelectorAll('.chat-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="help"]').classList.add('active');
    
    // Reset to main help view
    document.getElementById('help-main').style.display = 'block';
    document.getElementById('help-category').style.display = 'none';
    document.getElementById('help-article').style.display = 'none';
    document.getElementById('help-search-results').style.display = 'none';
    document.getElementById('help-search-input').value = '';
};

// Ask question from home
window.askQuestion = function(question) {
    switchToMessages();
    setTimeout(() => {
        chatInput.value = question;
        handleUserMessage();
    }, 300);
};

// Helper to add message with formatting
function addMessage(text, sender, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'user-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    if (isHtml) {
        contentDiv.innerHTML = text;
    } else {
        // Format text for better display
        const formattedText = formatText(text);
        contentDiv.innerHTML = formattedText;
    }

    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    timeDiv.textContent = 'Just now';

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesTab.appendChild(messageDiv);

    // Scroll to bottom
    messagesTab.scrollTop = messagesTab.scrollHeight;
}

// Format text for better display
function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>') // Italic (not part of **)
        .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
        .replace(/^\* (.+)$/gm, '<li>$1</li>') // Convert * bullets to list items
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>') // Wrap list items in ul
        .replace(/<\/li>\s*<li>/g, '</li><li>') // Clean up list formatting
        .replace(/\n\n/g, '</p><p>') // Paragraphs
        .replace(/\n/g, '<br>') // Line breaks
        .replace(/^(.*)$/, '<p>$1</p>') // Wrap in paragraph
        .replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>') // Fix ul wrapping
        .replace(/<p><\/p>/g, '') // Remove empty paragraphs
        .replace(/^<p>/, '').replace(/<\/p>$/, '') // Remove outer paragraph tags
        .replace(/&#39;/g, "'") // Fix HTML entities
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
}

// LOCAL FALLBACK MATCHING (In case API fails)
function findBestMatchFallback(userInput) {
    if (!userInput) return null;

    const STOP_WORDS = new Set([
        "a", "an", "the", "is", "are", "was", "were", "to", "of", "in", "on", "at", "for",
        "by", "with", "about", "how", "what", "when", "where", "who", "why", "can", "could",
        "would", "should", "do", "does", "did", "i", "me", "my", "you", "your", "it", "its",
        "we", "our", "they", "their", "hello", "hi", "hey"
    ]);

    function getTokens(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    function getMeaningfulTokens(tokens) {
        return tokens.filter(word => !STOP_WORDS.has(word));
    }

    const inputTokens = getTokens(userInput);
    const inputMeaningful = getMeaningfulTokens(inputTokens);

    let bestMatch = null;
    let highestScore = 0;

    for (const item of FULL_DATASET) {
        if (!item.question) continue;

        const questionTokens = getTokens(item.question);
        const questionMeaningful = getMeaningfulTokens(questionTokens);

        const useMeaningful = inputMeaningful.length > 0 && questionMeaningful.length > 0;
        const setA = useMeaningful ? inputMeaningful : inputTokens;
        const setB = useMeaningful ? questionMeaningful : questionTokens;

        let matchCount = 0;
        for (const word of setA) {
            if (setB.includes(word)) {
                matchCount++;
            }
        }

        let score = 0;
        const totalTokens = setA.length + setB.length;
        if (totalTokens > 0) {
            score = (2 * matchCount) / totalTokens;
        }

        const normalizedInput = inputTokens.join(' ');
        const normalizedQuestion = questionTokens.join(' ');

        if (normalizedInput === normalizedQuestion) {
            score = 1.1;
        } else if (normalizedQuestion.includes(normalizedInput) || normalizedInput.includes(normalizedQuestion)) {
            score += 0.2;
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }

    if (highestScore > 0.3) {
        return bestMatch.answer;
    }
    return null;
}

// Call API endpoint
async function callGroqAPI(userMessage) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error("API Error:", error);

        // Use Fallback silently
        const fallbackResponse = findBestMatchFallback(userMessage);
        if (fallbackResponse) {
            return fallbackResponse;
        }

        return "I'm having trouble connecting to the server. Please try again.";
    }
}

// Handle User Message
async function handleUserMessage() {
    if (state.conversation_ended) return;

    const input = chatInput.value.trim();
    if (!input && state.attached_files.length === 0) return;

    // Check word limit
    const wordCount = input.split(/\s+/).length;
    if (wordCount > 50) {
        alert('Please limit your message to 50 words or less.');
        return;
    }

    // If user not verified, show verification form
    if (!state.user_verified) {
        state.pending_first_message = input;
        addMessage(input, 'user');
        chatInput.value = '';
        clearAttachments();
        showVerificationForm();
        return;
    }

    // Check message limit
    state.message_count++;
    if (state.message_count > 5) {
        addMessage(`I'm so sorry I am not able to solve your query. For immediate assistance, please contact our customer care team:<br><br>📞 ${CUSTOMER_CARE_NUMBER}<br><br>They'll be able to help you right away.`, 'bot', true);
        chatInput.disabled = true;
        sendBtn.disabled = true;
        state.conversation_ended = true;
        return;
    }

    // Add user message
    addMessage(input, 'user');
    chatInput.value = '';
    clearAttachments();

    // Send to Google Sheets
    sendChatToSheets(input);

    state.turn_count++;

    // Add temporary loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message', 'loading-msg');
    loadingDiv.innerHTML = `<div class="message-content">Thinking...</div>`;
    messagesTab.appendChild(loadingDiv);
    messagesTab.scrollTop = messagesTab.scrollHeight;

    // Call API with full context logic
    const responseText = await callGroqAPI(input);

    // Remove loading message
    loadingDiv.remove();

    addMessage(responseText, 'bot');

    // Show default message after bot response
    setTimeout(() => {
        showDefaultMessage();
    }, 1500);

    // Satisfaction Check Logic
    if (state.turn_count >= 3 && !state.satisfaction_asked) {
        setTimeout(() => askSatisfaction(), 1000);
    }
}

function askSatisfaction() {
    const satisfactionDiv = document.createElement('div');
    satisfactionDiv.classList.add('message', 'bot-message');
    satisfactionDiv.innerHTML = `
        <div class="message-content">
            Does this answer clear things up for you?
            <div class="satisfaction-buttons" style="margin-top: 10px; display: flex; gap: 10px;">
                <button onclick="handleSatisfaction('yes')" class="sat-btn">Yes</button>
                <button onclick="handleSatisfaction('no')" class="sat-btn">No</button>
            </div>
        </div>
        <div class="message-time">Just now</div>
    `;
    messagesTab.appendChild(satisfactionDiv);
    messagesTab.scrollTop = messagesTab.scrollHeight;
    state.satisfaction_asked = true;
}

// Expose to window for inline onclicks
window.handleSatisfaction = function (answer) {
    if (state.conversation_ended) return;

    if (answer === 'yes') {
        setTimeout(() => {
            addMessage("Great! If you have more questions regarding any topic, I’m here to help.", 'bot');
            state.satisfaction_asked = false;
            state.dissatisfaction_count = 0;
        }, 500);
    } else {
        state.dissatisfaction_count++;
        if (state.dissatisfaction_count === 1) {
            setTimeout(() => {
                addMessage("I’m sorry about that — let’s sort it out. Can you tell me what part was unclear or what you’d like explained differently?", 'bot');
                state.satisfaction_asked = false;
            }, 500);
        } else if (state.dissatisfaction_count >= 2) {
            setTimeout(() => {
                addMessage(`I don’t want to waste your time. For immediate assistance, please contact our customer care team:<br><br>📞 ${CUSTOMER_CARE_NUMBER}<br><br>They’ll be able to help you right away.<br><br><button onclick="startNewChat()" class="sat-btn" style="background-color: var(--primary-color); color: white; margin-top: 10px;">Start New Chat</button>`, 'bot', true);
                state.conversation_ended = true;
                statusText.textContent = "Offline";
                statusText.style.color = "gray";
                document.querySelector('.status-dot').style.backgroundColor = "gray";
                chatInput.disabled = true;
                sendBtn.disabled = true;
            }, 500);
        }
    }

    // Remove buttons to prevent multiple clicks
    const btns = document.querySelectorAll('.sat-btn');
    btns.forEach(btn => {
        if (!btn.getAttribute('onclick').includes('startNewChat')) {
            btn.remove();
        }
    });
};

const SUGGESTED_QUESTIONS = [
    "What is a prop firm?",
    "How to take a payout",
    "Drawdown rules",
    "Profit split"
];

function showDefaultMessage() {
    const defaultMsg = `Is there anything else you'd like to know about prop firm rules, challenges, or payouts?`;
    
    const suggestionsHtml = `
        <div class="suggestion-container">
            ${SUGGESTED_QUESTIONS.map(q =>
        `<button onclick="handleSuggestion('${q}')" class="suggestion-chip">${q}</button>`
    ).join('')}
        </div>
    `;
    
    addMessage(defaultMsg + suggestionsHtml, 'bot', true);
}

function showWelcomeMessage() {
    const welcomeMsg = `Hello! I'm your Intelligent Assistant. I can explain rules, challenges, risk limits, payouts, and operational policies. How can I help you today?`;

    // Create suggestion chips HTML
    const suggestionsHtml = `
        <div class="suggestion-container">
            ${SUGGESTED_QUESTIONS.map(q =>
        `<button onclick="handleSuggestion('${q}')" class="suggestion-chip">${q}</button>`
    ).join('')}
        </div>
    `;

    addMessage(welcomeMsg + suggestionsHtml, 'bot', true);
}

window.handleSuggestion = function (text) {
    if (state.conversation_ended) return;
    chatInput.value = text;
    handleUserMessage();
};

// Show verification form
function showVerificationForm() {
    const formDiv = document.createElement('div');
    formDiv.classList.add('message', 'bot-message', 'verification-form-container');
    formDiv.innerHTML = `
        <div class="message-content">
            <p style="margin-bottom: 12px;">Before we continue, please provide your contact details:</p>
            <div class="verification-form">
                <input type="email" id="user-email" placeholder="Email address" required />
                <input type="tel" id="user-phone" placeholder="Phone number" required />
                <button onclick="submitVerification()" class="verify-btn">Submit</button>
                <div id="verification-error" class="verification-error"></div>
            </div>
        </div>
        <div class="message-time">Just now</div>
    `;
    messagesTab.appendChild(formDiv);
    messagesTab.scrollTop = messagesTab.scrollHeight;
    chatInput.disabled = true;
    sendBtn.disabled = true;
}

// Submit verification
window.submitVerification = async function() {
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const errorDiv = document.getElementById('verification-error');
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = 'Please enter a valid email address';
        return;
    }
    
    // Validate phone (digits only, 10-15 digits)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
        errorDiv.textContent = 'Please enter a valid phone number (10-15 digits)';
        return;
    }
    
    // Send to Google Sheets
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                phone: phone,
                message: state.pending_first_message || ''
            })
        });
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
    }
    
    // Mark as verified and store user info
    state.user_verified = true;
    state.user_email = email;
    state.user_phone = phone;
    errorDiv.textContent = '';
    
    // Disable form
    document.getElementById('user-email').disabled = true;
    document.getElementById('user-phone').disabled = true;
    document.querySelector('.verify-btn').disabled = true;
    document.querySelector('.verify-btn').textContent = 'Verified ✓';
    
    // Re-enable chat input
    chatInput.disabled = false;
    sendBtn.disabled = false;
    
    // Process the pending message
    if (state.pending_first_message) {
        processPendingMessage();
    }
};

// Process pending message after verification
async function processPendingMessage() {
    const input = state.pending_first_message;
    state.pending_first_message = null;
    
    // Check message limit
    state.message_count++;
    if (state.message_count > 5) {
        addMessage(`I'm so sorry I am not able to solve your query. For immediate assistance, please contact our customer care team:<br><br>📞 ${CUSTOMER_CARE_NUMBER}<br><br>They'll be able to help you right away.`, 'bot', true);
        chatInput.disabled = true;
        sendBtn.disabled = true;
        state.conversation_ended = true;
        return;
    }

    state.turn_count++;

    // Add temporary loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message', 'loading-msg');
    loadingDiv.innerHTML = `<div class="message-content">Thinking...</div>`;
    messagesTab.appendChild(loadingDiv);
    messagesTab.scrollTop = messagesTab.scrollHeight;

    // Call API with full context logic
    const responseText = await callGroqAPI(input);

    // Remove loading message
    loadingDiv.remove();

    addMessage(responseText, 'bot');

    // Show default message after bot response
    setTimeout(() => {
        showDefaultMessage();
    }, 1500);

    // Satisfaction Check Logic
    if (state.turn_count >= 3 && !state.satisfaction_asked) {
        setTimeout(() => askSatisfaction(), 1000);
    }
}

window.startNewChat = function () {
    // Reset State
    state = {
        turn_count: 0,
        last_intent: null,
        satisfaction_asked: false,
        dissatisfaction_count: 0,
        conversation_ended: false,
        message_count: 0,
        user_verified: false,
        pending_first_message: null,
        attached_files: [],
        user_email: null,
        user_phone: null
    };

    // Reset UI
    messagesTab.innerHTML = '';

    // Add Welcome Message with Suggestions
    showWelcomeMessage();

    // Re-enable Input
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.value = '';
    chatInput.focus();

    // Reset Status
    statusText.textContent = "Online";
    statusText.style.color = "#666666";
    document.querySelector('.status-dot').style.backgroundColor = "#34d399";
};

// File attachment handlers
window.handleFileUpload = function(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        state.attached_files.push({name: file.name, type: 'file'});
    });
    updateAttachmentPreview();
    event.target.value = '';
};

window.handleVoiceRecord = function() {
    state.attached_files.push({name: 'Voice message', type: 'voice'});
    updateAttachmentPreview();
};

function updateAttachmentPreview() {
    const container = document.getElementById('attachment-preview');
    if (state.attached_files.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';
    container.innerHTML = state.attached_files.map((file, idx) => `
        <div class="attachment-chip">
            <span>${file.type === 'voice' ? '🎤' : '📎'} ${file.name}</span>
            <button onclick="removeAttachment(${idx})" class="remove-attachment">×</button>
        </div>
    `).join('');
}

window.removeAttachment = function(index) {
    state.attached_files.splice(index, 1);
    updateAttachmentPreview();
};

function clearAttachments() {
    state.attached_files = [];
    updateAttachmentPreview();
}

// Send chat message to Google Sheets
async function sendChatToSheets(message) {
    if (!state.user_email || !state.user_phone) return;
    
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: state.user_email,
                phone: state.user_phone,
                message: message
            })
        });
    } catch (error) {
        console.error('Failed to send chat to Google Sheets:', error);
    }
}

// Initialize chat on load
// Don't auto-start, show home tab by default

// Event Listeners
sendBtn.addEventListener('click', handleUserMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
});

// Header Reset Button
document.getElementById('header-reset-btn').addEventListener('click', startNewChat);

// Widget Toggle Logic
const chatContainer = document.querySelector('.chat-container');
const chatLauncher = document.getElementById('chat-launcher');
const closeBtn = document.getElementById('header-close-btn');
const launcherIcon = document.querySelector('.launcher-icon');
const closeIcon = document.querySelector('.close-icon');

function toggleChat() {
    const isActive = chatContainer.classList.contains('active');

    if (isActive) {
        chatContainer.classList.remove('active');
        launcherIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    } else {
        chatContainer.classList.add('active');
        launcherIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        // Focus input when opened
        setTimeout(() => chatInput.focus(), 300);
    }
}

chatLauncher.addEventListener('click', toggleChat);
closeBtn.addEventListener('click', () => {
    chatContainer.classList.remove('active');
    launcherIcon.style.display = 'block';
    closeIcon.style.display = 'none';
});

// Bottom Navigation Handler
document.querySelectorAll('.chat-bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.chat-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const tab = this.getAttribute('data-tab');
        // Tab functionality can be extended here
        console.log('Switched to:', tab);
        
        if (tab === 'home') {
            homeTab.style.display = 'block';
            messagesTab.style.display = 'none';
            document.getElementById('help-tab').style.display = 'none';
            document.getElementById('chat-input-area').style.display = 'none';
        } else if (tab === 'messages') {
            switchToMessages();
        } else if (tab === 'help') {
            switchToHelp();
        }
    });
});

// FAQ Data Structure - Comprehensive Sharkfunded Knowledge Base
const FAQ_DATA = {
    evaluation: {
        title: "Evaluation Models",
        questions: [
            {
                q: "What is the 2-Step Evaluation Model?",
                a: "<p>The 2-Step Evaluation is our gold standard vetting process designed to verify trader skill over an extended period.</p><p><strong>Phase 1 - Initial Assessment:</strong></p><ul><li>Profit Target: 8%</li><li>Max Daily Loss: 5%</li><li>Max Total Loss: 10%</li><li>Leverage: 1:100</li><li>No time limit</li></ul><p><strong>Phase 2 - Verification:</strong></p><ul><li>Profit Target: 5%</li><li>Max Daily Loss: 5%</li><li>Max Total Loss: 10%</li><li>Leverage: 1:100</li><li>No time limit</li></ul><p>This two-phased approach ensures your performance results from a robust strategy rather than fortunate trades.</p>"
            },
            {
                q: "What is the 1-Step Evaluation Model?",
                a: "<p>The 1-Step Evaluation is a streamlined alternative for experienced traders who wish to bypass the two-phase process.</p><p><strong>Requirements:</strong></p><ul><li>Profit Target: 10%</li><li>Max Daily Loss: 3% (Balance-based)</li><li>Max Total Loss: 6% (Static)</li><li>Leverage: 1:50</li><li>Payout Ratio: Up to 90%</li><li>No time limit</li></ul><p>While faster, it imposes stricter risk parameters to compensate for the lack of a second verification stage. Ideal for traders with high win rates and low volatility strategies.</p>"
            },
            {
                q: "What are the account tiers and fees?",
                a: "<p>We offer multiple account sizes to accommodate diverse trading needs:</p><table style='width:100%; border-collapse: collapse; margin: 10px 0;'><tr style='background: #f5f5f5;'><th style='padding: 8px; border: 1px solid #ddd;'>Account Size</th><th style='padding: 8px; border: 1px solid #ddd;'>Fee</th><th style='padding: 8px; border: 1px solid #ddd;'>1-Step Target</th><th style='padding: 8px; border: 1px solid #ddd;'>2-Step Phase 1</th></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$5,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$49</td><td style='padding: 8px; border: 1px solid #ddd;'>$500</td><td style='padding: 8px; border: 1px solid #ddd;'>$400</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$10,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$89</td><td style='padding: 8px; border: 1px solid #ddd;'>$1,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$800</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$25,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$149</td><td style='padding: 8px; border: 1px solid #ddd;'>$2,500</td><td style='padding: 8px; border: 1px solid #ddd;'>$2,000</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$50,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$289</td><td style='padding: 8px; border: 1px solid #ddd;'>$5,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$4,000</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$100,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$479</td><td style='padding: 8px; border: 1px solid #ddd;'>$10,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$8,000</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>$200,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$929</td><td style='padding: 8px; border: 1px solid #ddd;'>$20,000</td><td style='padding: 8px; border: 1px solid #ddd;'>$16,000</td></tr></table><p>The evaluation fee is often refundable upon your first successful payout in the funded phase.</p>"
            }
        ]
    },
    drawdown: {
        title: "Drawdown & Risk Management",
        questions: [
            {
                q: "How does Balance-Based Daily Drawdown work?",
                a: "<p>We utilize a Daily Loss Limit based on the starting balance of each day. The day resets at 5:00 PM EST (Server Time).</p><p><strong>Example:</strong></p><ul><li>Starting balance: $100,000</li><li>Daily limit: 5%</li><li>Account breaches if equity/balance drops below $95,000 during that 24-hour period</li></ul><p><strong>Critical Nuances:</strong></p><ul><li>Based on balance, not equity</li><li>Floating profits don't increase next day's allowance until closed</li><li>Floating losses at daily reset tighten the next session's limit</li></ul><p>This provides a more objective and less volatile benchmark for performance.</p>"
            },
            {
                q: "What is Static vs. Trailing Drawdown?",
                a: "<p>THE ONLY PROP uses a <strong>Static Maximum Total Drawdown</strong> - a significant advantage for traders.</p><p><strong>Static Drawdown:</strong></p><ul><li>Floor remains fixed at initial percentage of starting balance</li><li>Example: $100,000 account with 10% static = $90,000 floor</li><li>If you grow to $110,000, you have $20,000 buffer ($110,000 - $90,000)</li><li>Rewards profitable traders with a safety cushion</li></ul><p><strong>Trailing Drawdown (Not Used):</strong></p><ul><li>Floor moves up as equity increases</li><li>Can trap profits and make position management difficult</li></ul><p>Our static model allows you to withstand market volatility without losing funded status.</p>"
            },
            {
                q: "How to avoid drawdown violations?",
                a: "<p><strong>Professional Risk Management:</strong></p><ul><li>Use 1-2% risk per trade maximum</li><li>Always set stop losses before entering trades</li><li>Monitor daily and total drawdown constantly</li><li>Avoid revenge trading after losses</li><li>Take breaks during losing streaks</li><li>Never over-leverage positions</li><li>Keep detailed trading journal</li></ul><p>The most frequent cause of account termination is drawdown violations. Discipline and risk management are essential for long-term success.</p>"
            }
        ]
    },
    trading: {
        title: "Trading Rules & Conduct",
        questions: [
            {
                q: "What are the News Trading restrictions?",
                a: "<p>News trading rules differ between evaluation and funded phases.</p><p><strong>Evaluation Phase:</strong></p><ul><li>Generally permitted</li><li>Exercise caution during high-impact events</li></ul><p><strong>Funded Phase:</strong></p><ul><li>Cannot open/close trades within 2-minute window of Red Folder events</li><li>Protects against extreme slippage and gapping</li><li>Trades opened before news with stop-loss are usually permitted</li></ul><p>This restriction protects the firm from toxic flow during temporary liquidity gaps.</p>"
            },
            {
                q: "What is Lot Size Consistency?",
                a: "<p>We emphasize consistent position sizing to distinguish professional trading from gambling.</p><p><strong>Requirements:</strong></p><ul><li>Don't drastically change position sizes</li><li>Example: If you typically trade 1.0 lot, suddenly opening 50.0 lots is a violation</li><li>Success must be repeatable, not from a single lucky trade</li></ul><p><strong>Purpose:</strong></p><ul><li>Ensures strategy sustainability</li><li>Protects firm from concentration risk</li><li>Validates professional trading approach</li></ul>"
            },
            {
                q: "What strategies are prohibited?",
                a: "<p>The following strategies exploit platform mechanics rather than market movements:</p><p><strong>Prohibited:</strong></p><ul><li><strong>Latency Arbitrage:</strong> Using high-speed data feeds against slower platform quotes</li><li><strong>HFT:</strong> High-frequency bots executing hundreds of trades per second</li><li><strong>Copy Trading:</strong> Copying other Sharkfunded users' trades</li><li><strong>Reverse Trading/Hedging:</strong> Opening opposite positions across multiple accounts</li></ul><p><strong>Allowed:</strong></p><ul><li>Day trading</li><li>Swing trading</li><li>Scalping (within reason)</li><li>Technical/fundamental analysis strategies</li></ul>"
            }
        ]
    },
    platforms: {
        title: "Trading Platforms & Technology",
        questions: [
            {
                q: "What trading platforms are available?",
                a: "<p>We provide diverse platforms for operational continuity:</p><p><strong>DXTrade:</strong></p><ul><li>Web-based, versatile platform</li><li>Sophisticated charting package</li><li>Integrated economic calendar</li><li>Intuitive multi-position management</li></ul><p><strong>Match-Trader:</strong></p><ul><li>Mobile-first approach</li><li>Seamless desktop-mobile transition</li><li>Fast execution speed</li><li>Proprietary interface feel</li></ul><p><strong>cTrader:</strong></p><ul><li>Level II pricing (depth of market)</li><li>Essential for large-volume traders</li><li>Manage slippage effectively</li></ul>"
            },
            {
                q: "What are the spreads and commissions?",
                a: "<p>We provide Raw Spreads through our liquidity providers:</p><table style='width:100%; border-collapse: collapse; margin: 10px 0;'><tr style='background: #f5f5f5;'><th style='padding: 8px; border: 1px solid #ddd;'>Asset Class</th><th style='padding: 8px; border: 1px solid #ddd;'>Spread</th><th style='padding: 8px; border: 1px solid #ddd;'>Commission</th><th style='padding: 8px; border: 1px solid #ddd;'>Leverage</th></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Forex Majors</td><td style='padding: 8px; border: 1px solid #ddd;'>0.0-0.5 pips</td><td style='padding: 8px; border: 1px solid #ddd;'>$7/lot</td><td style='padding: 8px; border: 1px solid #ddd;'>1:100</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Gold (XAUUSD)</td><td style='padding: 8px; border: 1px solid #ddd;'>10-20 cents</td><td style='padding: 8px; border: 1px solid #ddd;'>$7/lot</td><td style='padding: 8px; border: 1px solid #ddd;'>1:20</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Indices</td><td style='padding: 8px; border: 1px solid #ddd;'>1.0-2.0 pts</td><td style='padding: 8px; border: 1px solid #ddd;'>$0/lot</td><td style='padding: 8px; border: 1px solid #ddd;'>1:20</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Crypto</td><td style='padding: 8px; border: 1px solid #ddd;'>Variable</td><td style='padding: 8px; border: 1px solid #ddd;'>$0/lot</td><td style='padding: 8px; border: 1px solid #ddd;'>1:2</td></tr></table><p>Lower leverage on volatile assets prevents excessive risk exposure.</p>"
            },
            {
                q: "How to deal with slippage and latency?",
                a: "<p>Slippage is natural during high volatility with Market Execution.</p><p><strong>Mitigation Strategies:</strong></p><ul><li>Use Limit Orders instead of Market Orders when possible</li><li>Avoid trading during Rollover period (5:00 PM EST)</li><li>Ensure stable internet connection</li><li>Consider using VPS (Virtual Private Server)</li><li>Trade during high-liquidity sessions (London/NY overlap)</li></ul><p>Slippage is not manipulation - it's a natural market phenomenon during volatile periods.</p>"
            }
        ]
    },
    payouts: {
        title: "Payouts & Profit Sharing",
        questions: [
            {
                q: "What is the profit split structure?",
                a: "<p>We offer industry-leading profit splits:</p><p><strong>Standard Split:</strong></p><ul><li>80% to trader</li><li>20% to firm</li></ul><p><strong>Enhanced Split:</strong></p><ul><li>Up to 90% to trader</li><li>Available through performance or account add-ons</li></ul><p>The majority of value created by you is retained by you. This is among the most competitive splits in the industry.</p>"
            },
            {
                q: "How does the payout process work?",
                a: "<p>Payouts are processed on a bi-weekly (14-day) cycle.</p><p><strong>Eligibility Requirements:</strong></p><ul><li>Funded account in net profit position</li><li>All active trades closed at payout request time</li><li>No trading rule violations during period</li><li>Account in good standing</li></ul><p><strong>Process:</strong></p><ul><li>Submit request through trader dashboard</li><li>Processing time: 24-72 hours typically</li><li>First payout requires KYC verification</li></ul>"
            },
            {
                q: "What is the Scaling Plan?",
                a: "<p>Our scaling plan transforms successful retail traders into institutional-scale fund managers.</p><p><strong>Criteria:</strong></p><ul><li>Achieve 10%+ total profit over consecutive 3 months</li><li>Receive at least 2 payouts during this period</li></ul><p><strong>Reward:</strong></p><ul><li>25% increase in account balance</li><li>Can scale up to $4,000,000 total</li></ul><p><strong>Example Growth ($200K account):</strong></p><ul><li>3 months: $250,000</li><li>6 months: $312,500</li><li>9 months: $390,625</li><li>12 months: $488,281</li></ul><p>This geometric growth incentivizes long-term, low-risk approaches.</p>"
            }
        ]
    },
    compliance: {
        title: "Compliance & Verification",
        questions: [
            {
                q: "What is the KYC/AML process?",
                a: "<p>As a global entity, we operate within strict KYC and AML regulations.</p><p><strong>Required Documents:</strong></p><ul><li><strong>Identity Verification:</strong> Government-issued ID (Passport/Driver's License)</li><li><strong>Proof of Residence:</strong> Utility bill or bank statement</li><li><strong>Contractor Agreement:</strong> Professional services agreement signature</li></ul><p><strong>Processing:</strong></p><ul><li>Typically completed within 24-72 hours</li><li>Automated cross-reference against global sanction lists</li><li>Ensures compliance with international financial standards</li></ul>"
            },
            {
                q: "Are there restricted countries?",
                a: "<p>Due to international financial regulations, we cannot offer services to residents of certain jurisdictions.</p><p><strong>Typically Restricted:</strong></p><ul><li>Countries under OFAC sanctions (North Korea, Iran, Syria)</li><li>Jurisdictions with local bans on proprietary trading models</li><li>Regions with specific regulatory restrictions</li></ul><p>It is your responsibility to ensure you are legally permitted to trade in your home country. Contact support for specific country inquiries.</p>"
            },
            {
                q: "What happens if I breach my account?",
                a: "<p><strong>Hard Breach:</strong></p><ul><li>Account permanently disabled</li><li>Occurs from rule violations (drawdown, prohibited strategies)</li></ul><p><strong>Reset Options:</strong></p><ul><li>Discounted retake/reset available</li><li>Recognizes that failure is part of learning process</li><li>Opportunity to try again with improved strategy</li></ul><p><strong>Soft Breach:</strong></p><ul><li>Minor violations may result in trade closure without account loss</li><li>Depends on specific account terms</li></ul>"
            }
        ]
    },
    operations: {
        title: "Funded Account Operations",
        questions: [
            {
                q: "What is the inactivity policy?",
                a: "<p>Funded traders must be active market participants.</p><p><strong>Policy:</strong></p><ul><li>Accounts inactive for 30+ days may be suspended/terminated</li><li>Ensures capital is being utilized effectively</li><li>Allows other talented traders to access capital</li></ul><p><strong>To Maintain Active Status:</strong></p><ul><li>Place at least one trade per month</li><li>Communicate with support if taking planned break</li></ul>"
            },
            {
                q: "What is the Buffer Strategy?",
                a: "<p>Professional traders create an equity buffer for account protection.</p><p><strong>Strategy Options:</strong></p><table style='width:100%; border-collapse: collapse; margin: 10px 0;'><tr style='background: #f5f5f5;'><th style='padding: 8px; border: 1px solid #ddd;'>Strategy</th><th style='padding: 8px; border: 1px solid #ddd;'>Action</th><th style='padding: 8px; border: 1px solid #ddd;'>Result</th></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Aggressive</td><td style='padding: 8px; border: 1px solid #ddd;'>Withdraw all profits</td><td style='padding: 8px; border: 1px solid #ddd;'>Max cash flow, min buffer</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Balanced</td><td style='padding: 8px; border: 1px solid #ddd;'>Withdraw 70%, leave 30%</td><td style='padding: 8px; border: 1px solid #ddd;'>Moderate flow, growing buffer</td></tr><tr><td style='padding: 8px; border: 1px solid #ddd;'>Conservative</td><td style='padding: 8px; border: 1px solid #ddd;'>Leave until 5% buffer built</td><td style='padding: 8px; border: 1px solid #ddd;'>Delayed flow, max protection</td></tr></table><p>Since drawdown is static, leaving profits increases distance from breach threshold.</p>"
            },
            {
                q: "How do I get technical support?",
                a: "<p>We provide 24/7 technical assistance to ensure traders aren't penalized for technical issues.</p><p><strong>Support Channels:</strong></p><ul><li><strong>Live Chat:</strong> Available 24/7 in dashboard</li><li><strong>Email:</strong> support@theonlyprop.com</li><li><strong>Discord Community:</strong> Real-time peer support</li><li><strong>Help Center:</strong> Comprehensive documentation</li></ul><p><strong>Response Times:</strong></p><ul><li>Critical issues: Within 1 hour</li><li>General inquiries: Within 24 hours</li><li>Account reviews: 24-72 hours</li></ul>"
            }
        ]
    }
};

// Show FAQ Category
window.showFaqCategory = function(category) {
    const data = FAQ_DATA[category];
    const categoryDiv = document.getElementById('help-category');
    const mainDiv = document.getElementById('help-main');
    
    let html = `
        <h3><button class="back-btn" onclick="backToFaqMain()">←</button> ${data.title}</h3>
        <p style="color: #888; font-size: 0.85rem; margin-bottom: 20px;">${data.questions.length} articles</p>
    `;
    
    data.questions.forEach((item, index) => {
        html += `
            <div class="faq-expandable" id="faq-${category}-${index}">
                <div class="faq-question" onclick="toggleFaqAnswer('${category}', ${index})">
                    <span>${item.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="faq-answer">
                    <div class="faq-answer-content">${item.a}</div>
                </div>
            </div>
        `;
    });
    
    categoryDiv.innerHTML = html;
    mainDiv.style.display = 'none';
    categoryDiv.style.display = 'block';
};

// Toggle FAQ Answer
window.toggleFaqAnswer = function(category, index) {
    const faqItem = document.getElementById(`faq-${category}-${index}`);
    faqItem.classList.toggle('active');
};

// Back to Main FAQ
window.backToFaqMain = function() {
    document.getElementById('help-main').style.display = 'block';
    document.getElementById('help-category').style.display = 'none';
};

// Show Article
window.showArticle = function(category, index) {
    const data = FAQ_DATA[category];
    const article = data.questions[index];
    const articleDiv = document.getElementById('help-article');
    const categoryDiv = document.getElementById('help-category');
    const chatContainer = document.querySelector('.chat-container');
    
    const html = `
        <div class="article-header">
            <button class="back-btn" onclick="backToCategory('${category}')" style="margin-bottom: 15px;">← Back</button>
            <h2>${article.q}</h2>
            <div class="article-meta">Updated recently</div>
        </div>
        <div class="article-content">
            ${article.a}
        </div>
    `;
    
    articleDiv.innerHTML = html;
    categoryDiv.style.display = 'none';
    articleDiv.style.display = 'block';
    chatContainer.classList.add('expanded');
};

// Back to Category
window.backToCategory = function(category) {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.classList.remove('expanded');
    
    setTimeout(() => {
        document.getElementById('help-article').style.display = 'none';
        document.getElementById('help-category').style.display = 'block';
    }, 100);
};

// Help Search Functionality
const helpSearchInput = document.getElementById('help-search-input');
const helpSearchResults = document.getElementById('help-search-results');
const helpMain = document.getElementById('help-main');
const helpCategory = document.getElementById('help-category');

if (helpSearchInput) {
    helpSearchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length === 0) {
            // Show main help view
            helpSearchResults.style.display = 'none';
            helpMain.style.display = 'block';
            helpCategory.style.display = 'none';
            return;
        }
        
        // Hide main views and show search results
        helpMain.style.display = 'none';
        helpCategory.style.display = 'none';
        helpSearchResults.style.display = 'block';
        
        // Search through FAQ data
        const results = searchFAQ(query);
        displaySearchResults(results, query);
    });
}

function searchFAQ(query) {
    const results = [];
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    
    // Search through all categories and questions
    for (const [categoryKey, categoryData] of Object.entries(FAQ_DATA)) {
        categoryData.questions.forEach((item, index) => {
            const questionLower = item.q.toLowerCase();
            const answerLower = item.a.toLowerCase().replace(/<[^>]*>/g, ''); // Strip HTML
            
            // Calculate relevance score
            let score = 0;
            
            // Exact phrase match in question (highest priority)
            if (questionLower.includes(query)) {
                score += 100;
            }
            
            // Word matches in question
            queryWords.forEach(word => {
                if (questionLower.includes(word)) {
                    score += 10;
                }
                if (answerLower.includes(word)) {
                    score += 2;
                }
            });
            
            // Category title match
            if (categoryData.title.toLowerCase().includes(query)) {
                score += 5;
            }
            
            if (score > 0) {
                results.push({
                    category: categoryKey,
                    categoryTitle: categoryData.title,
                    question: item.q,
                    answer: item.a,
                    index: index,
                    score: score
                });
            }
        });
    }
    
    // Sort by relevance score (highest first)
    results.sort((a, b) => b.score - a.score);
    
    return results;
}

function displaySearchResults(results, query) {
    if (results.length === 0) {
        helpSearchResults.innerHTML = `
            <div class="search-no-results">
                <p>No results found for "${escapeHtml(query)}"</p>
                <p style="color: #888; font-size: 0.85rem; margin-top: 8px;">Try different keywords or browse categories below</p>
            </div>
        `;
        return;
    }
    
    let html = `<div class="search-results-header">Found ${results.length} result${results.length !== 1 ? 's' : ''}</div>`;
    
    // Show top 10 results
    results.slice(0, 10).forEach(result => {
        // Extract preview text from answer
        const plainAnswer = result.answer.replace(/<[^>]*>/g, '').substring(0, 150);
        
        html += `
            <div class="search-result-item" onclick="showSearchResult('${result.category}', ${result.index})">
                <div class="search-result-category">${escapeHtml(result.categoryTitle)}</div>
                <div class="search-result-question">${highlightQuery(result.question, query)}</div>
                <div class="search-result-preview">${highlightQuery(plainAnswer, query)}...</div>
            </div>
        `;
    });
    
    helpSearchResults.innerHTML = html;
}

function highlightQuery(text, query) {
    const escaped = escapeHtml(text);
    const queryEscaped = escapeHtml(query);
    const regex = new RegExp(`(${queryEscaped})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.showSearchResult = function(category, index) {
    // Clear search
    helpSearchInput.value = '';
    helpSearchResults.style.display = 'none';
    
    // Show the category with the specific question expanded
    showFaqCategory(category);
    
    // Expand the specific question
    setTimeout(() => {
        const faqItem = document.getElementById(`faq-${category}-${index}`);
        if (faqItem) {
            faqItem.classList.add('active');
            faqItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};
