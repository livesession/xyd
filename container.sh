pnpm i
pnpm run build
npm i -g verdaccio
# echo "//localhost:4873/:_auth=$(echo -n 'test:test' | base64)" >> ~/.npmrc
nohup verdaccio > verdaccio.log 2>&1 &
npm login --registry http://localhost:4873
# npm i -g npm-cli-login
# npm-cli-login -u test -p test -e test@example.com -r http://localhost:4873
curl -fsSL https://bun.com/install | bash 
source /home/codespace/.bashrc
./release.js

