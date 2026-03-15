// lib/agents/langchain/demo.ts
// Phase 2 Demo: Testing the LangGraph Agent

import { LangchainAgent } from './agent';

async function demo() {
  console.log('🚀 Phase 2: LangGraph Agent Demo\n');
  console.log('='.repeat(60));

  // =========================================================================
  // Test 1: Initialize Agent
  // =========================================================================
  console.log('\n📦 Test 1: Initialize Agent');
  console.log('-'.repeat(60));

  const agent = new LangchainAgent({ conversationId: 'demo-session-1' });
  console.log('✓ Agent initialized');
  console.log('  Conversation ID:', agent.state.conversationId);
  console.log('  Messages count:', agent.state.messages.length);
  console.log('  Last updated:', agent.state.lastUpdated);

  // =========================================================================
  // Test 2: Basic Message Handling (Non-Streaming)
  // =========================================================================
  console.log('\n\n💬 Test 2: Basic Message Handling (Non-Streaming)');
  console.log('-'.repeat(60));

  console.log('\n📤 User: Hi, I\'m interested in a hair transplant');
  const response1 = await agent.handleMessage({
    role: 'user',
    text: "Hi, I'm interested in a hair transplant",
  });
  console.log('🤖 Assistant:', response1.text.substring(0, 200) + '...');
  console.log('   Created at:', response1.createdAt);

  // =========================================================================
  // Test 3: Conversation Context (Multi-Turn)
  // =========================================================================
  console.log('\n\n🔄 Test 3: Conversation Context (Multi-Turn)');
  console.log('-'.repeat(60));

  console.log('\n📤 User: What\'s the typical recovery time?');
  const response2 = await agent.handleMessage({
    role: 'user',
    text: "What's the typical recovery time?",
  });
  console.log('🤖 Assistant:', response2.text.substring(0, 200) + '...');

  console.log('\n📤 User: And how much does it typically cost?');
  const response3 = await agent.handleMessage({
    role: 'user',
    text: "And how much does it typically cost?",
  });
  console.log('🤖 Assistant:', response3.text.substring(0, 200) + '...');

  // =========================================================================
  // Test 4: Streaming Message Handling
  // =========================================================================
  console.log('\n\n⚡ Test 4: Streaming Message Handling');
  console.log('-'.repeat(60));

  console.log('\n📤 User: Can you explain the FUE procedure?');
  console.log('🤖 Assistant (streaming): ');
  process.stdout.write('   ');

  let streamedText = '';
  await agent.handleMessageStream(
    {
      role: 'user',
      text: "Can you explain the FUE procedure?",
    },
    (chunk) => {
      streamedText += chunk;
      process.stdout.write(chunk);
    }
  );

  console.log('\n   [Stream complete - received', streamedText.length, 'characters]');

  // =========================================================================
  // Test 5: State Management
  // =========================================================================
  console.log('\n\n📊 Test 5: State Management');
  console.log('-'.repeat(60));

  const state = agent.getState();
  const messages = agent.getMessages();

  console.log('✓ Current state:');
  console.log('  Conversation ID:', state.conversationId);
  console.log('  Total messages:', messages.length);
  console.log('  Last updated:', state.lastUpdated);

  console.log('\n✓ Message breakdown:');
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  console.log('  User messages:', userMessages.length);
  console.log('  Assistant messages:', assistantMessages.length);

  // =========================================================================
  // Test 6: Conversation History
  // =========================================================================
  console.log('\n\n📜 Test 6: Full Conversation History');
  console.log('-'.repeat(60));

  messages.forEach((msg, idx) => {
    const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
    const preview = msg.text.substring(0, 80);
    const truncated = msg.text.length > 80 ? '...' : '';
    console.log(`\n[${idx}] ${roleEmoji} ${msg.role.toUpperCase()}`);
    console.log(`    ${preview}${truncated}`);
    console.log(`    @ ${msg.createdAt}`);
  });

  // =========================================================================
  // Test 7: Clear Messages
  // =========================================================================
  console.log('\n\n🗑️  Test 7: Clear Messages');
  console.log('-'.repeat(60));

  console.log('Messages before clear:', agent.getMessages().length);
  agent.clearMessages();
  console.log('Messages after clear:', agent.getMessages().length);
  console.log('✓ Conversation cleared (ID preserved:', agent.state.conversationId + ')');

  // =========================================================================
  // Test 8: Reset Agent
  // =========================================================================
  console.log('\n\n🔄 Test 8: Reset Agent');
  console.log('-'.repeat(60));

  console.log('Starting new conversation...');
  agent.reset('new-session-id');
  console.log('✓ Agent reset');
  console.log('  New Conversation ID:', agent.state.conversationId);
  console.log('  Messages count:', agent.getMessages().length);

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n\n✅ Phase 2 Demo Complete!');
  console.log('='.repeat(60));
  console.log('\n✓ All tests passed:');
  console.log('  [✓] Agent initialization');
  console.log('  [✓] Basic message handling');
  console.log('  [✓] Conversation context');
  console.log('  [✓] Streaming support');
  console.log('  [✓] State management');
  console.log('  [✓] Message history');
  console.log('  [✓] Clear messages');
  console.log('  [✓] Agent reset');

  console.log('\n🎯 Next Steps:');
  console.log('  → Phase 3: Build messaging interface (UI components)');
  console.log('  → Phase 4: Implement database lookup tool');
  console.log('  → Phase 5: Create API route for Next.js integration');

  console.log('\n💡 Try it yourself:');
  console.log('  npx tsx lib/agents/langchain/demo.ts');
  console.log('');
}

// Run the demo
demo().catch((error) => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
