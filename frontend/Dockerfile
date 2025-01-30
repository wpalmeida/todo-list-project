# Use the official Nginx image as the base image
FROM nginx:alpine

# Copy the build output to the Nginx HTML directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]