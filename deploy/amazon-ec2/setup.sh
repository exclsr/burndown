# prepare for couchdb
sudo apt-get install python-software-properties -y
sudo add-apt-repository ppa:couchdb/stable -y
sudo apt-get update -y

# remove any existing couchdb binaries
sudo apt-get remove couchdb couchdb-bin couchdb-common -yf

# install latest
sudo apt-get install -V couchdb

# install helpful things
sudo apt-get install git -y
sudo apt-get install nodejs -y
sudo apt-get install npm -y

sudo npm install -g forever

# nodejs -> node
sudo ln -s /usr/bin/nodejs /usr/local/bin/node

# get the app
cd 
mkdir repos && cd repos
git clone https://github.com/holmwell/circle-tasks
cd circle-tasks/server/
sudo npm install --production

# put the app in the deploy folder
cd 
mkdir -p apps/circle-tasks/server
cp -R repos/circle-tasks/server/* apps/circle-tasks/server
