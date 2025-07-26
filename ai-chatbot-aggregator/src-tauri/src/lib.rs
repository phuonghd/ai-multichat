use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
struct ChatBotResponse {
    id: String,
    name: String,
    response: String,
    status: String,
    error: Option<String>,
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct PromptRequest {
    prompt: String,
    chatbots: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PromptResponse {
    results: Vec<ChatBotResponse>,
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatBotConfig {
    id: String,
    name: String,
    url: String,
    is_enabled: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn send_prompt_to_chatbots(request: PromptRequest) -> Result<PromptResponse, String> {
    // Execute the Node.js script to handle AI interactions
    let output = Command::new("node")
        .arg("ai-backend.js")
        .arg("--prompt")
        .arg(&request.prompt)
        .arg("--chatbots")
        .arg(request.chatbots.join(","))
        .output()
        .map_err(|e| format!("Failed to execute AI backend: {}", e))?;

    if output.status.success() {
        let response_str = String::from_utf8_lossy(&output.stdout);
        let response: PromptResponse = serde_json::from_str(&response_str)
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        Ok(response)
    } else {
        let error_str = String::from_utf8_lossy(&output.stderr);
        Err(format!("AI backend error: {}", error_str))
    }
}

#[tauri::command]
async fn get_chatbots_list() -> Result<Vec<ChatBotConfig>, String> {
    Ok(vec![
        ChatBotConfig {
            id: "chatgpt".to_string(),
            name: "ChatGPT".to_string(),
            url: "https://chat.openai.com".to_string(),
            is_enabled: true,
        },
        ChatBotConfig {
            id: "claude".to_string(),
            name: "Claude".to_string(),
            url: "https://claude.ai".to_string(),
            is_enabled: true,
        },
        ChatBotConfig {
            id: "gemini".to_string(),
            name: "Gemini".to_string(),
            url: "https://gemini.google.com".to_string(),
            is_enabled: true,
        },
        ChatBotConfig {
            id: "perplexity".to_string(),
            name: "Perplexity".to_string(),
            url: "https://www.perplexity.ai".to_string(),
            is_enabled: true,
        },
    ])
}

#[tauri::command]
async fn setup_chatbot_sessions() -> Result<String, String> {
    let output = Command::new("node")
        .arg("ai-backend.js")
        .arg("--setup-sessions")
        .output()
        .map_err(|e| format!("Failed to setup sessions: {}", e))?;

    if output.status.success() {
        Ok("Sessions setup completed".to_string())
    } else {
        let error_str = String::from_utf8_lossy(&output.stderr);
        Err(format!("Session setup error: {}", error_str))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            send_prompt_to_chatbots,
            get_chatbots_list,
            setup_chatbot_sessions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
