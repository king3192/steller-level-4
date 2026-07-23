#!/usr/bin/env bash
# Shell script to execute atomic, conventional commits for Level 4 production upgrade and push to GitHub

set -e

echo "Executing Level 4 Production Upgrade Commit Sequence..."

git rm --cached .env 2>/dev/null || true

# 1. Secret & Repo Hygiene
git add .gitignore .env.example
git commit -m "chore(security): untrack .env and expand .env.example with Level 4 variables"

# 2. Explorer Helpers & Network Constants
git add src/constants/network.js
git commit -m "feat(network): add Stellar Expert explorer helper links for contracts and transactions"

# 3. Format Utility Fixes
git add src/utils/format.js
git commit -m "fix(format): export formatAddress with start/end char options"

# 4. Smart Contract Test Verification
git add contracts/room_manager/src/lib.rs contracts/rent_split/src/lib.rs
git commit -m "test(contracts): verify RoomManager and RentSplit Rust contract unit and integration tests"

# 5. Automated Deployment Script Refinements
git add deploy-all.ps1 deploy-all.sh
git commit -m "chore(deploy): update automated cross-contract deployment and linking scripts"

# 6. Error Boundary Component
git add src/components/ErrorBoundary.jsx
git commit -m "feat(architecture): add React ErrorBoundary for graceful error recovery and Sentry integration"

# 7. Sentry & Error Boundary Setup in Main
git add src/main.jsx
git commit -m "feat(monitoring): initialize Sentry error tracking and wrap app shell with ErrorBoundary"

# 8. Analytics Tracking Utility
git add src/utils/analytics.js
git commit -m "feat(analytics): create centralized analytics utility for user interaction telemetry"

# 9. CI/CD Workflow Upgrade
git add .github/workflows/ci.yml
git commit -m "ci(github-actions): enforce strict ESLint and smart contract testing in CI pipeline"

# 10. Responsive Header Enhancement
git add src/components/Header.jsx
git commit -m "feat(ui): add mobile navigation controls and modal triggers to Header component"

# 11. Responsive Wallet Panel
git add src/components/WalletPanel.jsx
git commit -m "refactor(ui): optimize WalletPanel responsiveness and touch-friendly controls"

# 12. Responsive Admin Dashboard
git add src/components/AdminDashboard.jsx
git commit -m "refactor(ui): enhance AdminDashboard with responsive roommate allocation cards"

# 13. Skeleton Loading UI
git add src/components/Skeleton.jsx
git commit -m "feat(ui): add Skeleton loading placeholders for dashboard and activity feed"

# 14. Toast Notification Alert System
git add src/components/Toast.jsx
git commit -m "feat(ui): add lightweight Toast notification component for feedback alerts"

# 15. Network Offline Detector Banner
git add src/components/OfflineBanner.jsx
git commit -m "feat(ux): add OfflineBanner component for internet connectivity status tracking"

# 16. Comprehensive Error Classifier Extension
git add src/utils/errors.js
git commit -m "fix(errors): extend error classifier to handle RPC timeouts, panics, and offline states"

# 17. User Onboarding Modal
git add src/components/OnboardingModal.jsx
git commit -m "feat(onboarding): add 4-step guided onboarding modal for first-time visitors"

# 18. Public Proof of Usage Activity Explorer
git add src/components/ProofOfUsageView.jsx
git commit -m "feat(proof-of-usage): add public proof-of-usage feed with Stellar Expert transaction links"

# 19. Formspree Feedback Collector
git add src/components/FeedbackModal.jsx
git commit -m "feat(feedback): add FeedbackModal component with Formspree integration and fallback"

# 20. Core App Orchestration Upgrade
git add src/App.jsx
git commit -m "feat(app): orchestrate onboarding, proof of usage, feedback, toasts, and Vercel analytics"

# 21. Single-Command Vercel Config & Vite Base Path
git add vercel.json vite.config.js
git commit -m "feat(deploy): add vercel.json configuration and flexible Vite base path"

# 22. Package Dependencies Update
git add package.json
git commit -m "chore(deps): add @sentry/react and @vercel/analytics to package dependencies"

# 23. Architecture Documentation
git add ARCHITECTURE.md
git commit -m "docs(architecture): create ARCHITECTURE.md with Soroban cross-contract data flow diagram"

# 24. Documentation Overhaul in README
git add README.md
git commit -m "docs(readme): rewrite README.md to map directly to Level 4 rubric criteria"

# 25. Deployment Documentation Update
git add DEPLOY.md
git commit -m "docs(deploy): update DEPLOY.md with Vercel deployment and contract verification steps"

# 26. Push Helper Scripts
git add push-to-github.ps1 push-to-github.bat commit-all.ps1 commit-all.sh
git commit -m "chore(release): add GitHub push automator scripts for steller-level-4"

echo "Setting remote origin to https://github.com/king3192/steller-level-4.git..."
git remote set-url origin https://github.com/king3192/steller-level-4.git 2>/dev/null || git remote add origin https://github.com/king3192/steller-level-4.git

echo "Renaming branch to main..."
git branch -M main

echo "Pushing to GitHub (origin main)..."
git push -u origin main

echo "All commits created and pushed to https://github.com/king3192/steller-level-4.git successfully!"
